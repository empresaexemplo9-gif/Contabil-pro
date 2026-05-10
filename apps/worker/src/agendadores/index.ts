import { Queue } from 'bullmq';
import type IORedis from 'ioredis';

import { logger } from '@contabilpro/logger';

import { NOMES_FILAS } from '../config.js';

export async function iniciarAgendadores(conexao: IORedis): Promise<void> {
  const filaObrigacoes = new Queue(NOMES_FILAS.obrigacoes, { connection: conexao });

  // Todos os dias às 06:00 (horário de São Paulo, em UTC: 09:00)
  await filaObrigacoes.upsertJobScheduler(
    'verificar-obrigacoes-proximas',
    { pattern: '0 9 * * *', tz: 'America/Sao_Paulo' },
    { name: 'verificar', data: {} },
  );

  logger.info('agendadores iniciados');
}
