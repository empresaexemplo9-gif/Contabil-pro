import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';

/**
 * Cron diário: marca como ATRASADA toda tarefa cujo dataVencimento já
 * passou e que ainda está PENDENTE ou EM_ANDAMENTO. Cross-tenant — a
 * role do Vercel/Neon em produção deve ter BYPASSRLS.
 */
export async function detectarAtrasadas(): Promise<{ atualizadas: number }> {
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const resultado = await prisma.tarefa.updateMany({
    where: {
      status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
      dataVencimento: { lt: inicioHoje },
    },
    data: { status: 'ATRASADA' },
  });

  logger.info({ atualizadas: resultado.count }, 'tarefas marcadas como atrasadas');
  return { atualizadas: resultado.count };
}
