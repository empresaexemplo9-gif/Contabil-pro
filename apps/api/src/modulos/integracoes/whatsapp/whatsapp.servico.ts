import {
  parsearWebhookWhatsapp,
  type MensagemRecebida,
} from '@contabilpro/integracoes';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';


import { PrismaService } from '../../../comum/prisma/prisma.service';
import { AtendimentoGateway } from '../../atendimento/atendimento.gateway';
import { DispatcherAutomacoes } from '../../automacoes/dispatcher.servico';
import { IntegracoesServico } from '../integracoes.servico';


import type { Prisma } from '@contabilpro/database';

@Injectable()
export class WhatsappServico {
  private readonly logger = new Logger(WhatsappServico.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integracoes: IntegracoesServico,
    @Inject(forwardRef(() => AtendimentoGateway))
    private readonly gateway: AtendimentoGateway,
    private readonly dispatcher: DispatcherAutomacoes,
  ) {}

  /**
   * Validação do desafio enviado pela Meta durante o setup do webhook.
   * Retorna o `hubChallenge` se o token bater, ou null se falhar.
   */
  async verificarWebhook(
    hubMode: string | undefined,
    hubVerifyToken: string | undefined,
    hubChallenge: string | undefined,
  ): Promise<string | null> {
    if (hubMode !== 'subscribe' || !hubVerifyToken || !hubChallenge) return null;
    const integracoes = await this.prisma.integracao.findMany({
      where: { provedor: 'WHATSAPP_CLOUD' },
      select: { credenciais: true, status: true },
    });
    const bate = integracoes.some((i) => {
      const creds = i.credenciais as { verifyToken?: string };
      return creds.verifyToken === hubVerifyToken;
    });
    return bate ? hubChallenge : null;
  }

  /**
   * Processa o payload de webhook do WhatsApp: agrupa as mensagens por
   * phoneNumberId, resolve o escritório, e persiste cada mensagem em
   * uma conversa (criando se não existir). Emite broadcast via Socket.IO.
   */
  async processarWebhook(payload: unknown): Promise<{ processadas: number; ignoradas: number }> {
    const evento = parsearWebhookWhatsapp(payload);

    let processadas = 0;
    let ignoradas = 0;

    for (const mensagem of evento.mensagens) {
      const escritorioId = await this.integracoes.escritorioPorPhoneNumberId(
        mensagem.phoneNumberId,
      );
      if (!escritorioId) {
        ignoradas += 1;
        this.logger.warn(
          `webhook recebido para phoneNumberId desconhecido: ${mensagem.phoneNumberId}`,
        );
        continue;
      }
      await this.registrarMensagem(escritorioId, mensagem);
      processadas += 1;
    }

    return { processadas, ignoradas };
  }

  private async registrarMensagem(
    escritorioId: string,
    mensagem: MensagemRecebida & { phoneNumberId: string },
  ): Promise<void> {
    // Dedup por externalId (wamid).
    const jaExiste = await this.prisma.mensagem.findFirst({
      where: { externalId: mensagem.externalId },
      select: { id: true },
    });
    if (jaExiste) return;

    const empresaId = await this.localizarEmpresaPorTelefone(
      escritorioId,
      mensagem.remetenteTelefone,
    );

    // Procura conversa aberta para o mesmo telefone no escritório, ou cria nova.
    const conversa = await this.acharOuCriarConversa(escritorioId, empresaId, mensagem);

    const nova = await this.prisma.mensagem.create({
      data: {
        conversaId: conversa.id,
        remetenteId: null, // mensagem de cliente externo
        corpo: mensagem.texto,
        externalId: mensagem.externalId,
        anexos: [] as Prisma.InputJsonValue,
      },
      include: { remetente: { select: { id: true, nome: true } } },
    });

    await this.prisma.conversa.update({
      where: { id: conversa.id },
      data: { ultimaMensagemEm: mensagem.timestamp, status: 'ABERTA' },
    });

    this.gateway.broadcastMensagemNova(escritorioId, conversa.id, nova);
    this.gateway.broadcastConversaAtualizada(escritorioId, conversa.id);

    await this.dispatcher.disparar({
      tipo: 'MENSAGEM_RECEBIDA',
      escritorioId,
      payload: {
        mensagem: {
          id: nova.id,
          conversaId: conversa.id,
          corpo: nova.corpo,
          externalId: nova.externalId,
          canal: 'WHATSAPP',
        },
        remetente: {
          telefone: mensagem.remetenteTelefone,
          nome: mensagem.remetenteNome ?? null,
        },
        empresaId,
      },
    });
  }

  private async acharOuCriarConversa(
    escritorioId: string,
    empresaId: string | null,
    mensagem: MensagemRecebida & { phoneNumberId: string },
  ): Promise<{ id: string }> {
    const aberta = await this.prisma.conversa.findFirst({
      where: {
        escritorioId,
        canal: 'WHATSAPP',
        status: { notIn: ['RESOLVIDA', 'ARQUIVADA'] },
        ...(empresaId ? { empresaId } : {}),
      },
      select: { id: true },
      orderBy: { criadoEm: 'desc' },
    });
    if (aberta) return aberta;

    return this.prisma.conversa.create({
      data: {
        escritorioId,
        empresaId,
        canal: 'WHATSAPP',
        status: 'ABERTA',
        assunto:
          mensagem.remetenteNome ?? `WhatsApp ${mensagem.remetenteTelefone}`,
        ultimaMensagemEm: mensagem.timestamp,
      },
      select: { id: true },
    });
  }

  private async localizarEmpresaPorTelefone(
    escritorioId: string,
    telefone: string,
  ): Promise<string | null> {
    const apenasDigs = telefone.replace(/\D/g, '');
    if (apenasDigs.length < 8) return null;
    const sufixo = apenasDigs.slice(-9); // últimos 9 dígitos (DDD + número)
    const contato = await this.prisma.contatoEmpresa.findFirst({
      where: {
        telefone: { contains: sufixo },
        empresa: { escritorioId },
      },
      select: { empresaId: true },
    });
    return contato?.empresaId ?? null;
  }

  /**
   * Lê o telefone alvo de uma conversa WhatsApp para envio outbound.
   * Usa o telefone do contato principal da empresa associada.
   */
  async obterTelefoneAlvo(conversaId: string): Promise<string | null> {
    const conversa = await this.prisma.conversa.findUnique({
      where: { id: conversaId },
      select: {
        canal: true,
        empresa: {
          select: {
            contatos: {
              where: { telefone: { not: null } },
              orderBy: { principal: 'desc' },
              select: { telefone: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!conversa || conversa.canal !== 'WHATSAPP') return null;
    const tel = conversa.empresa?.contatos[0]?.telefone ?? null;
    return tel ? tel.replace(/\D/g, '') : null;
  }
}
