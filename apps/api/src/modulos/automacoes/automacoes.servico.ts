import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type {
  AtualizarAutomacaoEntrada,
  CriarAutomacaoEntrada,
} from '@contabilpro/contracts';
import type { Prisma } from '@contabilpro/database';


@Injectable()
export class AutomacoesServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaServico,
  ) {}

  listar(escritorioId: string) {
    return this.prisma.automacao.findMany({
      where: { escritorioId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async obter(escritorioId: string, id: string) {
    const automacao = await this.prisma.automacao.findFirst({ where: { id, escritorioId } });
    if (!automacao) throw new NotFoundException('Automação não encontrada');
    return automacao;
  }

  async criar(usuario: UsuarioAutenticado, dados: CriarAutomacaoEntrada) {
    const automacao = await this.prisma.automacao.create({
      data: {
        escritorioId: usuario.escritorioId,
        nome: dados.nome,
        descricao: dados.descricao ?? null,
        gatilho: dados.gatilho as Prisma.InputJsonValue,
        passos: dados.passos as Prisma.InputJsonValue,
        status: dados.ativar ? 'ATIVA' : 'RASCUNHO',
      },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'automacao.criada',
      entidade: 'Automacao',
      entidadeId: automacao.id,
    });
    return automacao;
  }

  async atualizar(usuario: UsuarioAutenticado, id: string, dados: AtualizarAutomacaoEntrada) {
    await this.obter(usuario.escritorioId, id);
    const automacao = await this.prisma.automacao.update({
      where: { id },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(dados.descricao !== undefined ? { descricao: dados.descricao ?? null } : {}),
        ...(dados.gatilho ? { gatilho: dados.gatilho as Prisma.InputJsonValue } : {}),
        ...(dados.passos ? { passos: dados.passos as Prisma.InputJsonValue } : {}),
        ...(dados.ativar !== undefined ? { status: dados.ativar ? 'ATIVA' : 'PAUSADA' } : {}),
      },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'automacao.atualizada',
      entidade: 'Automacao',
      entidadeId: id,
    });
    return automacao;
  }

  async mudarStatus(usuario: UsuarioAutenticado, id: string, ativa: boolean) {
    const existente = await this.obter(usuario.escritorioId, id);
    if (existente.status === 'RASCUNHO' && !ativa) {
      throw new ConflictException('Automação em rascunho não pode ser pausada');
    }
    return this.prisma.automacao.update({
      where: { id },
      data: { status: ativa ? 'ATIVA' : 'PAUSADA' },
    });
  }

  async listarExecucoes(escritorioId: string, automacaoId: string) {
    await this.obter(escritorioId, automacaoId);
    return this.prisma.execucaoAutomacao.findMany({
      where: { automacaoId },
      orderBy: { iniciadaEm: 'desc' },
      take: 50,
    });
  }
}
