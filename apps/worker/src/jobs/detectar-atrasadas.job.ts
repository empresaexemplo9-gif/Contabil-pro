
import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';

import type { Job } from 'bullmq';

/**
 * Cron diário: marca como ATRASADA toda tarefa cujo dataVencimento já passou
 * e que ainda está PENDENTE ou EM_ANDAMENTO. Cross-tenant.
 */
export async function detectarAtrasadas(job: Job): Promise<{ atualizadas: number }> {
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const resultado = await prisma.tarefa.updateMany({
    where: {
      status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
      dataVencimento: { lt: inicioHoje },
    },
    data: { status: 'ATRASADA' },
  });

  logger.info(
    { jobId: job.id, atualizadas: resultado.count },
    'tarefas marcadas como atrasadas',
  );
  return { atualizadas: resultado.count };
}
