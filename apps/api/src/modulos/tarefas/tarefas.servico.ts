import { Injectable, NotFoundException } from '@nestjs/common';
import type { z } from 'zod';

import type {
  atualizarTarefaSchema,
  criarTarefaSchema,
  Paginacao,
} from '@contabilpro/contracts';

import { PrismaService } from '../../comum/prisma/prisma.service';

type CriarTarefa = z.infer<typeof criarTarefaSchema>;
type AtualizarTarefa = z.infer<typeof atualizarTarefaSchema>;

@Injectable()
export class TarefasServico {
  constructor(private readonly prisma: PrismaService) {}

  async listar(escritorioId: string, paginacao: Paginacao) {
    const [itens, total] = await Promise.all([
      this.prisma.tarefa.findMany({
        where: { escritorioId },
        orderBy: { dataVencimento: 'asc' },
        skip: (paginacao.pagina - 1) * paginacao.tamanho,
        take: paginacao.tamanho,
      }),
      this.prisma.tarefa.count({ where: { escritorioId } }),
    ]);
    return { itens, total, pagina: paginacao.pagina, tamanho: paginacao.tamanho };
  }

  criar(escritorioId: string, dados: CriarTarefa) {
    return this.prisma.tarefa.create({
      data: {
        escritorioId,
        empresaId: dados.empresaId ?? null,
        modeloId: dados.modeloId ?? null,
        titulo: dados.titulo,
        descricao: dados.descricao ?? null,
        prioridade: dados.prioridade,
        dataVencimento: dados.dataVencimento,
        responsavelId: dados.responsavelId ?? null,
      },
    });
  }

  async atualizar(escritorioId: string, id: string, dados: AtualizarTarefa) {
    const existente = await this.prisma.tarefa.findFirst({ where: { id, escritorioId } });
    if (!existente) throw new NotFoundException('Tarefa não encontrada');
    return this.prisma.tarefa.update({
      where: { id },
      data: {
        ...dados,
        concluidaEm: dados.status === 'CONCLUIDA' ? new Date() : undefined,
      },
    });
  }
}
