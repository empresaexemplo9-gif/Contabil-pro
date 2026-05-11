import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

export interface PontoSerieTempo {
  data: string;
  tarefasConcluidas: number;
  documentosEnviados: number;
}

@Injectable()
export class RelatoriosServico {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(escritorioId: string) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const em7Dias = new Date();
    em7Dias.setDate(em7Dias.getDate() + 7);

    const [
      totalEmpresas,
      empresasAtivas,
      tarefasPendentes,
      tarefasAtrasadas,
      tarefasVencendo,
      conversasAbertas,
      documentosMes,
      assinaturasPendentes,
    ] = await Promise.all([
      this.prisma.empresa.count({ where: { escritorioId } }),
      this.prisma.empresa.count({ where: { escritorioId, status: 'ATIVA' } }),
      this.prisma.tarefa.count({ where: { escritorioId, status: 'PENDENTE' } }),
      this.prisma.tarefa.count({ where: { escritorioId, status: 'ATRASADA' } }),
      this.prisma.tarefa.count({
        where: {
          escritorioId,
          status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
          dataVencimento: { lte: em7Dias },
        },
      }),
      this.prisma.conversa.count({
        where: { escritorioId, status: { in: ['ABERTA', 'EM_ATENDIMENTO'] } },
      }),
      this.prisma.documento.count({
        where: { escritorioId, criadoEm: { gte: inicioMes } },
      }),
      this.prisma.solicitacaoAssinatura.count({
        where: { escritorioId, status: { in: ['ENVIADA', 'PARCIAL'] } },
      }),
    ]);

    return {
      totalEmpresas,
      empresasAtivas,
      tarefasPendentes,
      tarefasAtrasadas,
      tarefasVencendoEm7Dias: tarefasVencendo,
      conversasAbertas,
      documentosNoMes: documentosMes,
      assinaturasPendentes,
    };
  }

  async tarefasPorStatus(
    escritorioId: string,
  ): Promise<Array<{ status: string; total: number }>> {
    const agrupado = await this.prisma.tarefa.groupBy({
      by: ['status'],
      where: { escritorioId },
      _count: { _all: true },
    });
    return agrupado
      .map((linha) => ({ status: linha.status, total: linha._count._all }))
      .sort((a, b) => b.total - a.total);
  }

  async empresasPorRegime(
    escritorioId: string,
  ): Promise<Array<{ regime: string; total: number }>> {
    const agrupado = await this.prisma.empresa.groupBy({
      by: ['regime'],
      where: { escritorioId, status: 'ATIVA' },
      _count: { _all: true },
    });
    return agrupado
      .map((linha) => ({ regime: linha.regime, total: linha._count._all }))
      .sort((a, b) => b.total - a.total);
  }

  async conversasPorCanal(
    escritorioId: string,
  ): Promise<Array<{ canal: string; total: number }>> {
    const agrupado = await this.prisma.conversa.groupBy({
      by: ['canal'],
      where: { escritorioId },
      _count: { _all: true },
    });
    return agrupado.map((linha) => ({ canal: linha.canal, total: linha._count._all }));
  }

  async atividade(escritorioId: string, dias = 30): Promise<PontoSerieTempo[]> {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - dias + 1);

    const [tarefas, documentos] = await Promise.all([
      this.prisma.tarefa.findMany({
        where: {
          escritorioId,
          status: 'CONCLUIDA',
          concluidaEm: { gte: inicio },
        },
        select: { concluidaEm: true },
      }),
      this.prisma.documento.findMany({
        where: { escritorioId, criadoEm: { gte: inicio } },
        select: { criadoEm: true },
      }),
    ]);

    const buckets = new Map<string, PontoSerieTempo>();
    for (let i = 0; i < dias; i += 1) {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      const chave = chaveData(dia);
      buckets.set(chave, { data: chave, tarefasConcluidas: 0, documentosEnviados: 0 });
    }

    for (const t of tarefas) {
      if (!t.concluidaEm) continue;
      const chave = chaveData(t.concluidaEm);
      const ponto = buckets.get(chave);
      if (ponto) ponto.tarefasConcluidas += 1;
    }
    for (const d of documentos) {
      const chave = chaveData(d.criadoEm);
      const ponto = buckets.get(chave);
      if (ponto) ponto.documentosEnviados += 1;
    }

    return Array.from(buckets.values());
  }
}

function chaveData(d: Date): string {
  return d.toISOString().slice(0, 10);
}
