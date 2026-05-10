import type { Job } from 'bullmq';
import { logger } from '@contabilpro/logger';
import { prisma } from '@contabilpro/database';
import type { CanalNotificacao, TipoNotificacao } from '@contabilpro/database';

interface PayloadNotificacao {
  escritorioId: string;
  usuarioId: string;
  tipo: TipoNotificacao;
  canal: CanalNotificacao;
  titulo: string;
  corpo: string;
  dados?: Record<string, unknown>;
}

export async function processarNotificacao(job: Job<PayloadNotificacao>): Promise<void> {
  const dados = job.data;
  await prisma.notificacao.create({
    data: {
      escritorioId: dados.escritorioId,
      usuarioId: dados.usuarioId,
      tipo: dados.tipo,
      canal: dados.canal,
      titulo: dados.titulo,
      corpo: dados.corpo,
      payload: dados.dados ?? {},
      enviadaEm: new Date(),
    },
  });
  logger.debug({ jobId: job.id, usuarioId: dados.usuarioId }, 'notificação persistida');
}
