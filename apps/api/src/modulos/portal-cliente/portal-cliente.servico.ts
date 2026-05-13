import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';
import { ArmazenamentoServico } from '../documentos/armazenamento.servico';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type { Prisma } from '@contabilpro/database';

export interface ContextoCliente {
  escritorioId: string;
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class PortalClienteServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly armazenamento: ArmazenamentoServico,
  ) {}

  /**
   * Extrai e valida o contexto do cliente: papel CLIENTE com empresaId ligado.
   */
  contexto(usuario: UsuarioAutenticado): ContextoCliente {
    if (usuario.papel !== 'CLIENTE' || !usuario.empresaId) {
      throw new ForbiddenException('Acesso restrito ao portal do cliente');
    }
    return {
      escritorioId: usuario.escritorioId,
      empresaId: usuario.empresaId,
      usuarioId: usuario.id,
    };
  }

  async resumo(ctx: ContextoCliente) {
    const em7Dias = new Date();
    em7Dias.setDate(em7Dias.getDate() + 7);

    const [empresa, docsRecentes, tarefasAbertas, tarefasVencendo, assinaturasPendentes, conversasAbertas] =
      await Promise.all([
        this.prisma.empresa.findFirst({
          where: { id: ctx.empresaId, escritorioId: ctx.escritorioId },
          select: { id: true, razaoSocial: true, nomeFantasia: true, cnpj: true, regime: true },
        }),
        this.prisma.documento.count({
          where: {
            empresaId: ctx.empresaId,
            escritorioId: ctx.escritorioId,
            criadoEm: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.tarefa.count({
          where: {
            empresaId: ctx.empresaId,
            escritorioId: ctx.escritorioId,
            status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'ATRASADA'] },
          },
        }),
        this.prisma.tarefa.count({
          where: {
            empresaId: ctx.empresaId,
            escritorioId: ctx.escritorioId,
            status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
            dataVencimento: { lte: em7Dias },
          },
        }),
        this.prisma.solicitacaoAssinatura.count({
          where: {
            escritorioId: ctx.escritorioId,
            documento: { empresaId: ctx.empresaId },
            status: { in: ['ENVIADA', 'PARCIAL'] },
          },
        }),
        this.prisma.conversa.count({
          where: {
            empresaId: ctx.empresaId,
            escritorioId: ctx.escritorioId,
            status: { in: ['ABERTA', 'EM_ATENDIMENTO'] },
          },
        }),
      ]);

    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    return {
      empresa,
      docsUltimos30Dias: docsRecentes,
      tarefasAbertas,
      tarefasVencendoEm7Dias: tarefasVencendo,
      assinaturasPendentes,
      conversasAbertas,
    };
  }

  listarDocumentos(ctx: ContextoCliente, termo?: string) {
    const where: Prisma.DocumentoWhereInput = {
      escritorioId: ctx.escritorioId,
      empresaId: ctx.empresaId,
      status: 'ATIVO',
    };
    if (termo) where.nome = { contains: termo, mode: 'insensitive' };
    return this.prisma.documento.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 100,
      select: {
        id: true,
        nome: true,
        mimeType: true,
        tamanhoBytes: true,
        criadoEm: true,
        versaoAtual: true,
        categoria: { select: { id: true, nome: true } },
      },
    });
  }

  async urlDownloadDocumento(ctx: ContextoCliente, id: string) {
    const doc = await this.prisma.documento.findFirst({
      where: {
        id,
        escritorioId: ctx.escritorioId,
        empresaId: ctx.empresaId,
        status: 'ATIVO',
      },
      select: { chaveStorage: true },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    return { url: await this.armazenamento.gerarUrlDownload(doc.chaveStorage) };
  }

  listarTarefas(ctx: ContextoCliente) {
    return this.prisma.tarefa.findMany({
      where: {
        escritorioId: ctx.escritorioId,
        empresaId: ctx.empresaId,
      },
      orderBy: [{ status: 'asc' }, { dataVencimento: 'asc' }],
      take: 200,
      select: {
        id: true,
        titulo: true,
        descricao: true,
        prioridade: true,
        status: true,
        dataVencimento: true,
        concluidaEm: true,
      },
    });
  }

  async assinaturasPendentes(ctx: ContextoCliente) {
    return this.prisma.solicitacaoAssinatura.findMany({
      where: {
        escritorioId: ctx.escritorioId,
        documento: { empresaId: ctx.empresaId },
        status: { in: ['ENVIADA', 'PARCIAL'] },
      },
      orderBy: { criadoEm: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        criadoEm: true,
        documento: { select: { id: true, nome: true } },
        signatarios: {
          select: { id: true, nome: true, email: true, status: true, assinadoEm: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });
  }

  listarConversas(ctx: ContextoCliente) {
    return this.prisma.conversa.findMany({
      where: { escritorioId: ctx.escritorioId, empresaId: ctx.empresaId },
      orderBy: [{ ultimaMensagemEm: 'desc' }, { criadoEm: 'desc' }],
      take: 50,
      select: {
        id: true,
        assunto: true,
        canal: true,
        status: true,
        ultimaMensagemEm: true,
        criadoEm: true,
        _count: { select: { mensagens: { where: { lidaEm: null } } } },
      },
    });
  }

  async obterConversa(ctx: ContextoCliente, id: string) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id, escritorioId: ctx.escritorioId, empresaId: ctx.empresaId },
      include: {
        mensagens: {
          orderBy: { criadoEm: 'asc' },
          include: { remetente: { select: { id: true, nome: true } } },
        },
      },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');
    return conversa;
  }

  async abrirConversa(ctx: ContextoCliente, dados: { assunto?: string; corpo: string }) {
    const agora = new Date();
    return this.prisma.conversa.create({
      data: {
        escritorioId: ctx.escritorioId,
        empresaId: ctx.empresaId,
        canal: 'PORTAL',
        status: 'ABERTA',
        assunto: dados.assunto?.trim() || null,
        ultimaMensagemEm: agora,
        mensagens: {
          create: { remetenteId: ctx.usuarioId, corpo: dados.corpo },
        },
      },
      include: { mensagens: true },
    });
  }

  async enviarMensagem(ctx: ContextoCliente, conversaId: string, corpo: string) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id: conversaId, escritorioId: ctx.escritorioId, empresaId: ctx.empresaId },
      select: { id: true, status: true },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');

    const agora = new Date();
    const [, mensagem] = await this.prisma.$transaction([
      this.prisma.conversa.update({
        where: { id: conversa.id },
        data: {
          ultimaMensagemEm: agora,
          status: conversa.status === 'RESOLVIDA' ? 'ABERTA' : conversa.status,
        },
      }),
      this.prisma.mensagem.create({
        data: { conversaId: conversa.id, remetenteId: ctx.usuarioId, corpo },
        include: { remetente: { select: { id: true, nome: true } } },
      }),
    ]);
    return mensagem;
  }

  async marcarConversaLida(ctx: ContextoCliente, conversaId: string) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id: conversaId, escritorioId: ctx.escritorioId, empresaId: ctx.empresaId },
      select: { id: true },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');
    await this.prisma.mensagem.updateMany({
      where: {
        conversaId: conversa.id,
        lidaEm: null,
        OR: [{ remetenteId: null }, { remetenteId: { not: ctx.usuarioId } }],
      },
      data: { lidaEm: new Date() },
    });
    return { ok: true };
  }
}
