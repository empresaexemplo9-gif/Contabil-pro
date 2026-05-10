import { Injectable, NotFoundException } from '@nestjs/common';

import type { CriarDocumentoEntrada, Paginacao } from '@contabilpro/contracts';

import { PrismaService } from '../../comum/prisma/prisma.service';
import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import { ArmazenamentoServico } from './armazenamento.servico';

@Injectable()
export class DocumentosServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly armazenamento: ArmazenamentoServico,
  ) {}

  async listar(escritorioId: string, paginacao: Paginacao) {
    const [itens, total] = await Promise.all([
      this.prisma.documento.findMany({
        where: { escritorioId, status: 'ATIVO' },
        orderBy: { criadoEm: paginacao.ordem },
        skip: (paginacao.pagina - 1) * paginacao.tamanho,
        take: paginacao.tamanho,
      }),
      this.prisma.documento.count({ where: { escritorioId, status: 'ATIVO' } }),
    ]);
    return { itens, total, pagina: paginacao.pagina, tamanho: paginacao.tamanho };
  }

  async obter(escritorioId: string, id: string) {
    const doc = await this.prisma.documento.findFirst({
      where: { id, escritorioId },
      include: { versoes: { orderBy: { versao: 'desc' } } },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    return {
      ...doc,
      urlDownload: await this.armazenamento.gerarUrlDownload(doc.chaveStorage),
    };
  }

  async registrar(usuario: UsuarioAutenticado, dados: CriarDocumentoEntrada) {
    const chave = this.armazenamento.gerarChave(usuario.escritorioId, dados.nome);
    return this.prisma.documento.create({
      data: {
        escritorioId: usuario.escritorioId,
        empresaId: dados.empresaId ?? null,
        categoriaId: dados.categoriaId ?? null,
        nome: dados.nome,
        mimeType: dados.mimeType,
        tamanhoBytes: BigInt(dados.tamanhoBytes),
        chaveStorage: chave,
        hashSha256: dados.hashSha256,
        criadoPorId: usuario.id,
      },
    });
  }
}
