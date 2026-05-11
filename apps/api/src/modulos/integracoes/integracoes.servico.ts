import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type { CriarIntegracaoEntrada } from '@contabilpro/contracts';
import type { Integracao, Prisma, ProvedorIntegracao } from '@contabilpro/database';


@Injectable()
export class IntegracoesServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaServico,
  ) {}

  listar(escritorioId: string) {
    return this.prisma.integracao.findMany({
      where: { escritorioId },
      select: {
        id: true,
        provedor: true,
        nome: true,
        status: true,
        ultimoErro: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async obter(escritorioId: string, id: string): Promise<Integracao> {
    const integracao = await this.prisma.integracao.findFirst({
      where: { id, escritorioId },
    });
    if (!integracao) throw new NotFoundException('Integração não encontrada');
    return integracao;
  }

  async criar(usuario: UsuarioAutenticado, dados: CriarIntegracaoEntrada) {
    const integracao = await this.prisma.integracao.create({
      data: {
        escritorioId: usuario.escritorioId,
        provedor: dados.provedor,
        nome: dados.nome,
        credenciais: dados.credenciais as Prisma.InputJsonValue,
        configuracoes: (dados.configuracoes ?? {}) as Prisma.InputJsonValue,
        status: dados.ativar ? 'ATIVA' : 'INATIVA',
      },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'integracao.criada',
      entidade: 'Integracao',
      entidadeId: integracao.id,
    });
    return { id: integracao.id, status: integracao.status };
  }

  async desativar(usuario: UsuarioAutenticado, id: string) {
    await this.obter(usuario.escritorioId, id);
    await this.prisma.integracao.update({
      where: { id },
      data: { status: 'INATIVA' },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'integracao.desativada',
      entidade: 'Integracao',
      entidadeId: id,
    });
    return { ok: true };
  }

  async remover(usuario: UsuarioAutenticado, id: string) {
    await this.obter(usuario.escritorioId, id);
    await this.prisma.integracao.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Localiza uma integração ativa por provedor para um escritório.
   * Usado pelo worker e por serviços que precisam das credenciais.
   */
  obterAtiva(escritorioId: string, provedor: ProvedorIntegracao): Promise<Integracao | null> {
    return this.prisma.integracao.findFirst({
      where: { escritorioId, provedor, status: 'ATIVA' },
    });
  }

  /**
   * Localiza o escritório a partir do phoneNumberId do WhatsApp.
   * Chamado pelo webhook de entrada antes de existir contexto de tenant.
   */
  async escritorioPorPhoneNumberId(phoneNumberId: string): Promise<string | null> {
    const integracoes = await this.prisma.integracao.findMany({
      where: { provedor: 'WHATSAPP_CLOUD', status: 'ATIVA' },
      select: { escritorioId: true, credenciais: true },
    });
    for (const i of integracoes) {
      const creds = i.credenciais as { phoneNumberId?: string };
      if (creds.phoneNumberId === phoneNumberId) return i.escritorioId;
    }
    return null;
  }

  async marcarErro(id: string, mensagem: string): Promise<void> {
    await this.prisma.integracao.update({
      where: { id },
      data: { status: 'ERRO', ultimoErro: mensagem },
    });
  }

  async registrarEventoWebhook(escritorioId: string | null, origem: string, payload: unknown) {
    return this.prisma.eventoWebhook.create({
      data: {
        escritorioId,
        origem,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }
}
