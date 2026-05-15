import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';


import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';
import { DispatcherAutomacoes } from '../automacoes/dispatcher.servico';

import { ArmazenamentoServico } from './armazenamento.servico';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type {
  BuscarDocumentos,
  CriarCategoriaDocumentoEntrada,
  CriarDocumentoEntrada,
  CriarVersaoDocumentoEntrada,
} from '@contabilpro/contracts';
import type { Prisma } from '@contabilpro/database';

@Injectable()
export class DocumentosServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly armazenamento: ArmazenamentoServico,
    private readonly auditoria: AuditoriaServico,
    private readonly dispatcher: DispatcherAutomacoes,
  ) {}

  async listar(escritorioId: string, filtros: BuscarDocumentos) {
    const where: Prisma.DocumentoWhereInput = {
      escritorioId,
      status: filtros.status,
    };
    if (filtros.empresaId) where.empresaId = filtros.empresaId;
    if (filtros.categoriaId) where.categoriaId = filtros.categoriaId;
    if (filtros.termo) where.nome = { contains: filtros.termo, mode: 'insensitive' };

    const [itens, total] = await Promise.all([
      this.prisma.documento.findMany({
        where,
        orderBy: { [filtros.ordenarPor]: filtros.ordem },
        skip: (filtros.pagina - 1) * filtros.tamanho,
        take: filtros.tamanho,
        include: {
          categoria: { select: { id: true, nome: true } },
          empresa: { select: { id: true, razaoSocial: true } },
        },
      }),
      this.prisma.documento.count({ where }),
    ]);

    return { itens, total, pagina: filtros.pagina, tamanho: filtros.tamanho };
  }

  async obter(escritorioId: string, id: string) {
    const documento = await this.prisma.documento.findFirst({
      where: { id, escritorioId },
      include: {
        categoria: { select: { id: true, nome: true } },
        empresa: { select: { id: true, razaoSocial: true } },
        versoes: { orderBy: { versao: 'desc' } },
      },
    });
    if (!documento) throw new NotFoundException('Documento não encontrado');
    const urlDownload = await this.armazenamento.gerarUrlDownload(documento.chaveStorage);
    return { ...documento, urlDownload };
  }

  async urlDownload(escritorioId: string, id: string): Promise<{ url: string }> {
    const doc = await this.prisma.documento.findFirst({
      where: { id, escritorioId },
      select: { chaveStorage: true },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    return { url: await this.armazenamento.gerarUrlDownload(doc.chaveStorage) };
  }

  async urlDownloadVersao(escritorioId: string, id: string, versaoId: string) {
    const versao = await this.prisma.versaoDocumento.findFirst({
      where: { id: versaoId, documentoId: id, documento: { escritorioId } },
      select: { chaveStorage: true },
    });
    if (!versao) throw new NotFoundException('Versão não encontrada');
    return { url: await this.armazenamento.gerarUrlDownload(versao.chaveStorage) };
  }

  async registrar(usuario: UsuarioAutenticado, dados: CriarDocumentoEntrada) {
    if (!dados.chaveStorage.startsWith(`${usuario.escritorioId}/`)) {
      throw new ConflictException('Chave de storage fora do escritório atual');
    }
    if (dados.empresaId) {
      const empresa = await this.prisma.empresa.findFirst({
        where: { id: dados.empresaId, escritorioId: usuario.escritorioId },
        select: { id: true },
      });
      if (!empresa) throw new NotFoundException('Empresa associada não encontrada');
    }

    const documento = await this.prisma.documento.create({
      data: {
        escritorioId: usuario.escritorioId,
        empresaId: dados.empresaId ?? null,
        categoriaId: dados.categoriaId ?? null,
        nome: dados.nome,
        mimeType: dados.mimeType,
        tamanhoBytes: BigInt(dados.tamanhoBytes),
        chaveStorage: dados.chaveStorage,
        hashSha256: dados.hashSha256,
        criadoPorId: usuario.id,
      },
    });

    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'documento.criado',
      entidade: 'Documento',
      entidadeId: documento.id,
    });

    await this.dispatcher.disparar({
      tipo: 'DOCUMENTO_ENVIADO',
      escritorioId: usuario.escritorioId,
      payload: {
        documento: {
          id: documento.id,
          nome: documento.nome,
          mimeType: documento.mimeType,
          tamanhoBytes: Number(documento.tamanhoBytes),
          categoriaId: documento.categoriaId,
          empresaId: documento.empresaId,
          criadoPorId: documento.criadoPorId,
        },
      },
    });

    return documento;
  }

  async criarVersao(
    usuario: UsuarioAutenticado,
    documentoId: string,
    dados: CriarVersaoDocumentoEntrada,
  ) {
    const doc = await this.prisma.documento.findFirst({
      where: { id: documentoId, escritorioId: usuario.escritorioId },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');

    const proximaVersao = doc.versaoAtual + 1;
    const versao = await this.prisma.$transaction(async (tx) => {
      const nova = await tx.versaoDocumento.create({
        data: {
          documentoId,
          versao: proximaVersao,
          chaveStorage: dados.chaveStorage,
          hashSha256: dados.hashSha256,
          tamanhoBytes: BigInt(dados.tamanhoBytes),
          notas: dados.notas ?? null,
          criadoPorId: usuario.id,
        },
      });
      await tx.documento.update({
        where: { id: documentoId },
        data: {
          chaveStorage: dados.chaveStorage,
          hashSha256: dados.hashSha256,
          mimeType: dados.mimeType,
          tamanhoBytes: BigInt(dados.tamanhoBytes),
          versaoAtual: proximaVersao,
        },
      });
      return nova;
    });

    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'documento.nova_versao',
      entidade: 'Documento',
      entidadeId: documentoId,
      diff: { versao: proximaVersao },
    });

    return versao;
  }

  async arquivar(usuario: UsuarioAutenticado, id: string) {
    const doc = await this.prisma.documento.findFirst({
      where: { id, escritorioId: usuario.escritorioId },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    if (doc.status === 'EXCLUIDO') throw new ConflictException('Documento já excluído');
    await this.prisma.documento.update({
      where: { id },
      data: { status: 'ARQUIVADO' },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'documento.arquivado',
      entidade: 'Documento',
      entidadeId: id,
    });
    return { ok: true };
  }

  async restaurar(usuario: UsuarioAutenticado, id: string) {
    const doc = await this.prisma.documento.findFirst({
      where: { id, escritorioId: usuario.escritorioId },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.prisma.documento.update({
      where: { id },
      data: { status: 'ATIVO' },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'documento.restaurado',
      entidade: 'Documento',
      entidadeId: id,
    });
    return { ok: true };
  }

  // --- Categorias ---

  listarCategorias(escritorioId: string) {
    return this.prisma.categoriaDocumento.findMany({
      where: { escritorioId },
      orderBy: { nome: 'asc' },
    });
  }

  async criarCategoria(
    usuario: UsuarioAutenticado,
    dados: CriarCategoriaDocumentoEntrada,
  ) {
    try {
      const categoria = await this.prisma.categoriaDocumento.create({
        data: {
          escritorioId: usuario.escritorioId,
          nome: dados.nome,
          descricao: dados.descricao ?? null,
          diasRetencao: dados.diasRetencao ?? null,
        },
      });
      await this.auditoria.registrar({
        escritorioId: usuario.escritorioId,
        atorId: usuario.id,
        acao: 'categoria_documento.criada',
        entidade: 'CategoriaDocumento',
        entidadeId: categoria.id,
      });
      return categoria;
    } catch (erro) {
      if ((erro as { code?: string }).code === 'P2002') {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
      throw erro;
    }
  }

  async atualizarCategoria(
    usuario: UsuarioAutenticado,
    id: string,
    dados: Partial<CriarCategoriaDocumentoEntrada>,
  ) {
    const existente = await this.prisma.categoriaDocumento.findFirst({
      where: { id, escritorioId: usuario.escritorioId },
    });
    if (!existente) throw new NotFoundException('Categoria não encontrada');
    return this.prisma.categoriaDocumento.update({
      where: { id },
      data: dados,
    });
  }

  async removerCategoria(usuario: UsuarioAutenticado, id: string) {
    const existente = await this.prisma.categoriaDocumento.findFirst({
      where: { id, escritorioId: usuario.escritorioId },
    });
    if (!existente) throw new NotFoundException('Categoria não encontrada');
    const emUso = await this.prisma.documento.count({
      where: { categoriaId: id },
    });
    if (emUso > 0) {
      throw new ConflictException(
        `Categoria não pode ser removida: ${emUso} documento(s) ainda referenciam`,
      );
    }
    await this.prisma.categoriaDocumento.delete({ where: { id } });
    return { ok: true };
  }
}
