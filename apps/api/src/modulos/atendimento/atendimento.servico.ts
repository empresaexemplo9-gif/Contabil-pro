import { InjectQueue } from '@nestjs/bullmq';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';


import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';

import { AtendimentoGateway } from './atendimento.gateway';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type {
  BuscarConversas,
  CriarConversaEntrada,
  StatusConversa,
} from '@contabilpro/contracts';
import type { Prisma } from '@contabilpro/database';
import type { Queue } from 'bullmq';

@Injectable()
export class AtendimentoServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaServico,
    @Inject(forwardRef(() => AtendimentoGateway))
    private readonly gateway: AtendimentoGateway,
    @InjectQueue('whatsapp') private readonly filaWhatsapp: Queue,
  ) {}

  async listar(escritorioId: string, filtros: BuscarConversas) {
    const where: Prisma.ConversaWhereInput = { escritorioId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.canal) where.canal = filtros.canal;
    if (filtros.empresaId) where.empresaId = filtros.empresaId;
    if (filtros.termo) {
      where.OR = [
        { assunto: { contains: filtros.termo, mode: 'insensitive' } },
        { mensagens: { some: { corpo: { contains: filtros.termo, mode: 'insensitive' } } } },
      ];
    }

    const [itens, total] = await Promise.all([
      this.prisma.conversa.findMany({
        where,
        orderBy: [{ ultimaMensagemEm: 'desc' }, { criadoEm: 'desc' }],
        skip: (filtros.pagina - 1) * filtros.tamanho,
        take: filtros.tamanho,
        include: {
          empresa: { select: { id: true, razaoSocial: true } },
          _count: { select: { mensagens: { where: { lidaEm: null } } } },
        },
      }),
      this.prisma.conversa.count({ where }),
    ]);

    return { itens, total, pagina: filtros.pagina, tamanho: filtros.tamanho };
  }

  async obter(escritorioId: string, id: string) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id, escritorioId },
      include: {
        empresa: { select: { id: true, razaoSocial: true } },
        mensagens: {
          orderBy: { criadoEm: 'asc' },
          include: { remetente: { select: { id: true, nome: true } } },
        },
      },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');
    return conversa;
  }

  async criar(usuario: UsuarioAutenticado, dados: CriarConversaEntrada) {
    if (dados.empresaId) {
      const empresa = await this.prisma.empresa.findFirst({
        where: { id: dados.empresaId, escritorioId: usuario.escritorioId },
        select: { id: true },
      });
      if (!empresa) throw new NotFoundException('Empresa não encontrada');
    }

    const agora = new Date();
    const conversa = await this.prisma.conversa.create({
      data: {
        escritorioId: usuario.escritorioId,
        empresaId: dados.empresaId ?? null,
        canal: dados.canal,
        assunto: dados.assunto,
        status: 'ABERTA',
        ultimaMensagemEm: agora,
        mensagens: {
          create: { remetenteId: usuario.id, corpo: dados.primeiraMensagem },
        },
      },
      include: { mensagens: true },
    });

    this.gateway.broadcastConversaAtualizada(usuario.escritorioId, conversa.id);
    return conversa;
  }

  async enviarMensagem(usuario: UsuarioAutenticado, conversaId: string, texto: string) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id: conversaId, escritorioId: usuario.escritorioId },
      select: { id: true, canal: true },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');

    const agora = new Date();
    const mensagem = await this.prisma.mensagem.create({
      data: { conversaId, remetenteId: usuario.id, corpo: texto },
      include: { remetente: { select: { id: true, nome: true } } },
    });
    await this.prisma.conversa.update({
      where: { id: conversaId },
      data: { ultimaMensagemEm: agora, status: 'EM_ATENDIMENTO' },
    });

    this.gateway.broadcastMensagemNova(usuario.escritorioId, conversaId, mensagem);
    this.gateway.broadcastConversaAtualizada(usuario.escritorioId, conversaId);

    // Outbound real: se a conversa é WhatsApp, enfileira para o worker entregar
    // via Graph API. A mensagem já está persistida e visível na UI; o envio
    // externo acontece em background com retries.
    if (conversa.canal === 'WHATSAPP') {
      await this.filaWhatsapp.add(
        'enviar',
        {
          escritorioId: usuario.escritorioId,
          conversaId: conversa.id,
          mensagemId: mensagem.id,
          texto,
        },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    }

    return mensagem;
  }

  async marcarLida(usuario: UsuarioAutenticado, conversaId: string) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id: conversaId, escritorioId: usuario.escritorioId },
      select: { id: true },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');

    await this.prisma.mensagem.updateMany({
      where: { conversaId, lidaEm: null, remetenteId: { not: usuario.id } },
      data: { lidaEm: new Date() },
    });
    this.gateway.broadcastConversaAtualizada(usuario.escritorioId, conversaId);
    return { ok: true };
  }

  async mudarStatus(
    usuario: UsuarioAutenticado,
    conversaId: string,
    novoStatus: StatusConversa,
  ) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id: conversaId, escritorioId: usuario.escritorioId },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');

    const atualizada = await this.prisma.conversa.update({
      where: { id: conversaId },
      data: { status: novoStatus },
    });

    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'conversa.status_alterado',
      entidade: 'Conversa',
      entidadeId: conversaId,
      diff: { de: conversa.status, para: novoStatus },
    });

    this.gateway.broadcastConversaAtualizada(usuario.escritorioId, conversaId);
    return atualizada;
  }
}
