import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';

import type { Prisma } from '@contabilpro/database';
import type { Job } from 'bullmq';

interface PayloadExecutarAutomacao {
  automacaoId: string;
  contexto: Record<string, unknown>;
}

export async function executarAutomacao(job: Job<PayloadExecutarAutomacao>): Promise<void> {
  const automacao = await prisma.automacao.findUnique({ where: { id: job.data.automacaoId } });
  if (!automacao) return;

  const execucao = await prisma.execucaoAutomacao.create({
    data: {
      automacaoId: automacao.id,
      contexto: job.data.contexto as Prisma.InputJsonValue,
    },
  });

  try {
    // TODO: motor que percorre `automacao.passos` aplicando ações.
    logger.info({ jobId: job.id, automacaoId: automacao.id }, 'executando automação (stub)');
    await prisma.execucaoAutomacao.update({
      where: { id: execucao.id },
      data: { status: 'CONCLUIDA', finalizadaEm: new Date() },
    });
  } catch (erro) {
    await prisma.execucaoAutomacao.update({
      where: { id: execucao.id },
      data: {
        status: 'FALHOU',
        finalizadaEm: new Date(),
        erro: (erro as Error).message,
      },
    });
    throw erro;
  }
}
