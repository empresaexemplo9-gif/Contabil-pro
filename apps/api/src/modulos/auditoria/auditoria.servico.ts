import { Prisma } from '@contabilpro/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

export interface RegistroAuditoria {
  escritorioId: string;
  atorId?: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  diff?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditoriaServico {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(dados: RegistroAuditoria): Promise<void> {
    await this.prisma.logAuditoria.create({
      data: {
        escritorioId: dados.escritorioId,
        atorId: dados.atorId ?? null,
        acao: dados.acao,
        entidade: dados.entidade,
        entidadeId: dados.entidadeId ?? null,
        diff: dados.diff ? (dados.diff as Prisma.InputJsonValue) : Prisma.JsonNull,
        ip: dados.ip ?? null,
        userAgent: dados.userAgent ?? null,
      },
    });
  }

  consultar(escritorioId: string, filtros: { entidade?: string; entidadeId?: string }) {
    return this.prisma.logAuditoria.findMany({
      where: {
        escritorioId,
        entidade: filtros.entidade ?? undefined,
        entidadeId: filtros.entidadeId ?? undefined,
      },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  }
}
