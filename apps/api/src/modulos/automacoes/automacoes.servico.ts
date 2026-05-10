import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

import type { Prisma } from '@contabilpro/database';


@Injectable()
export class AutomacoesServico {
  constructor(private readonly prisma: PrismaService) {}

  listar(escritorioId: string) {
    return this.prisma.automacao.findMany({
      where: { escritorioId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  criar(escritorioId: string, dados: { nome: string; gatilho: unknown; passos: unknown }) {
    return this.prisma.automacao.create({
      data: {
        escritorioId,
        nome: dados.nome,
        gatilho: dados.gatilho as Prisma.InputJsonValue,
        passos: dados.passos as Prisma.InputJsonValue,
      },
    });
  }
}
