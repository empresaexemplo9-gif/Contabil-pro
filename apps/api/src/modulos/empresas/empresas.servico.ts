import { apenasDigitos } from '@contabilpro/utils';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

import type { CriarEmpresaEntrada, Paginacao } from '@contabilpro/contracts';


@Injectable()
export class EmpresasServico {
  constructor(private readonly prisma: PrismaService) {}

  async listar(escritorioId: string, paginacao: Paginacao) {
    const [itens, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where: { escritorioId },
        orderBy: { [paginacao.ordenarPor ?? 'criadoEm']: paginacao.ordem },
        skip: (paginacao.pagina - 1) * paginacao.tamanho,
        take: paginacao.tamanho,
      }),
      this.prisma.empresa.count({ where: { escritorioId } }),
    ]);
    return { itens, total, pagina: paginacao.pagina, tamanho: paginacao.tamanho };
  }

  async obter(escritorioId: string, id: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id, escritorioId },
      include: { contatos: true },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  async criar(escritorioId: string, dados: CriarEmpresaEntrada) {
    return this.prisma.empresa.create({
      data: {
        escritorioId,
        cnpj: apenasDigitos(dados.cnpj),
        razaoSocial: dados.razaoSocial,
        nomeFantasia: dados.nomeFantasia ?? null,
        inscricaoEstadual: dados.inscricaoEstadual ?? null,
        inscricaoMunicipal: dados.inscricaoMunicipal ?? null,
        regime: dados.regime,
        dataAbertura: dados.dataAbertura ?? null,
        endereco: dados.endereco ?? undefined,
        observacoes: dados.observacoes ?? null,
      },
    });
  }

  async atualizar(escritorioId: string, id: string, dados: Partial<CriarEmpresaEntrada>) {
    await this.obter(escritorioId, id);
    return this.prisma.empresa.update({
      where: { id },
      data: {
        ...dados,
        cnpj: dados.cnpj ? apenasDigitos(dados.cnpj) : undefined,
      },
    });
  }

  async remover(escritorioId: string, id: string) {
    await this.obter(escritorioId, id);
    await this.prisma.empresa.update({
      where: { id },
      data: { status: 'INATIVA' },
    });
    return { ok: true };
  }
}
