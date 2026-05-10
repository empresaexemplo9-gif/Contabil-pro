import type { Job } from 'bullmq';
import { logger } from '@contabilpro/logger';
import { prisma } from '@contabilpro/database';

export async function lembrarObrigacao(job: Job): Promise<void> {
  const limite = new Date();
  limite.setDate(limite.getDate() + 3);

  const tarefasProximas = await prisma.tarefa.findMany({
    where: {
      status: 'PENDENTE',
      dataVencimento: { lte: limite, gte: new Date() },
    },
    select: { id: true, escritorioId: true, responsavelId: true, titulo: true, dataVencimento: true },
  });

  logger.info(
    { jobId: job.id, total: tarefasProximas.length },
    'verificando obrigações próximas do vencimento',
  );

  // TODO: enfileirar notificações para responsáveis (in-app + e-mail/WhatsApp).
}
