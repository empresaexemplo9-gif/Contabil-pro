import { logger } from '@contabilpro/logger';
import { Queue } from 'bullmq';

import { NOMES_FILAS } from '../config.js';

import type { Redis } from 'ioredis';



export async function iniciarAgendadores(conexao: Redis): Promise<void> {
  const filaObrigacoes = new Queue(NOMES_FILAS.obrigacoes, { connection: conexao });

  // Todos os dias às 06:00 (horário de São Paulo, em UTC: 09:00)
  await filaObrigacoes.upsertJobScheduler(
    'verificar-obrigacoes-proximas',
    { pattern: '0 9 * * *', tz: 'America/Sao_Paulo' },
    { name: 'verificar', data: {} },
  );

  logger.info('agendadores iniciados');
}
