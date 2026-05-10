import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

@Injectable()
export class RelatoriosServico {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(escritorioId: string) {
    const [totalEmpresas, tarefasPendentes, tarefasAtrasadas, conversasAbertas, documentosMes] =
      await Promise.all([
        this.prisma.empresa.count({ where: { escritorioId, status: 'ATIVA' } }),
        this.prisma.tarefa.count({ where: { escritorioId, status: 'PENDENTE' } }),
        this.prisma.tarefa.count({ where: { escritorioId, status: 'ATRASADA' } }),
        this.prisma.conversa.count({ where: { escritorioId, status: 'ABERTA' } }),
        this.prisma.documento.count({
          where: {
            escritorioId,
            criadoEm: { gte: new Date(new Date().setDate(1)) },
          },
        }),
      ]);

    return {
      totalEmpresas,
      tarefasPendentes,
      tarefasAtrasadas,
      conversasAbertas,
      documentosNoMes: documentosMes,
    };
  }
}
