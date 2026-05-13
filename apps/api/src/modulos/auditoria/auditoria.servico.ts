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

export interface FiltrosConsultaAuditoria {
  entidade?: string;
  entidadeId?: string;
  acao?: string;
  atorId?: string;
  desde?: Date;
  ate?: Date;
  limite?: number;
  cursor?: string;
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

  async consultar(escritorioId: string, filtros: FiltrosConsultaAuditoria = {}) {
    const limite = Math.min(Math.max(filtros.limite ?? 50, 1), 200);
    const where: Prisma.LogAuditoriaWhereInput = {
      escritorioId,
      entidade: filtros.entidade,
      entidadeId: filtros.entidadeId,
      acao: filtros.acao,
      atorId: filtros.atorId,
    };
    if (filtros.desde || filtros.ate) {
      where.criadoEm = {
        gte: filtros.desde,
        lte: filtros.ate,
      };
    }

    const itens = await this.prisma.logAuditoria.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: limite + 1,
      cursor: filtros.cursor ? { id: filtros.cursor } : undefined,
      skip: filtros.cursor ? 1 : 0,
      include: {
        ator: { select: { id: true, nome: true, email: true } },
      },
    });

    const proximoCursor = itens.length > limite ? (itens[limite]?.id ?? null) : null;
    return {
      itens: itens.slice(0, limite),
      proximoCursor,
    };
  }

  acoesDistintas(escritorioId: string) {
    return this.prisma.logAuditoria
      .findMany({
        where: { escritorioId },
        distinct: ['acao'],
        select: { acao: true },
        orderBy: { acao: 'asc' },
        take: 200,
      })
      .then((linhas) => linhas.map((l) => l.acao));
  }
}
