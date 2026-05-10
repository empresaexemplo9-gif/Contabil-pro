import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

import type { FrequenciaObrigacao } from '@contabilpro/database';


@Injectable()
export class ObrigacoesServico {
  constructor(private readonly prisma: PrismaService) {}

  listarModelos(escritorioId: string) {
    return this.prisma.modeloObrigacao.findMany({
      where: { escritorioId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  criarModelo(
    escritorioId: string,
    dados: { nome: string; frequencia: string; diaVencimento?: number },
  ) {
    return this.prisma.modeloObrigacao.create({
      data: {
        escritorioId,
        nome: dados.nome,
        frequencia: dados.frequencia as FrequenciaObrigacao,
        diaVencimento: dados.diaVencimento ?? null,
      },
    });
  }
}
