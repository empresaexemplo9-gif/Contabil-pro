import { logger } from '@contabilpro/logger';
import { Queue } from 'bullmq';

import { NOMES_FILAS } from '../config.js';

import type { Redis } from 'ioredis';



/**
 * Registra os schedulers cron do BullMQ. Cada `upsertJobScheduler` é
 * idempotente: chamadas repetidas com o mesmo nome apenas atualizam o
 * padrão se ele mudar.
 *
 * Fusos: usamos `America/Sao_Paulo` em todos os cron — o BullMQ converte
 * para UTC internamente.
 */
export async function iniciarAgendadores(conexao: Redis): Promise<void> {
  const filaObrigacoes = new Queue(NOMES_FILAS.obrigacoes, { connection: conexao });
  const filaGerador = new Queue(NOMES_FILAS.geradorTarefas, { connection: conexao });
  const filaDetector = new Queue(NOMES_FILAS.detectorAtrasadas, { connection: conexao });

  // Dia 25 de cada mês às 03:00 — gera tarefas para o próximo mês.
  // Escolhido para que tarefas estejam disponíveis com 1+ semana de antecedência.
  await filaGerador.upsertJobScheduler(
    'gerar-tarefas-proximo-mes',
    { pattern: '0 3 25 * *', tz: 'America/Sao_Paulo' },
    { name: 'gerar', data: {} },
  );

  // Todos os dias às 01:00 — marca tarefas vencidas como ATRASADA.
  await filaDetector.upsertJobScheduler(
    'detectar-atrasadas',
    { pattern: '0 1 * * *', tz: 'America/Sao_Paulo' },
    { name: 'detectar', data: {} },
  );

  // Todos os dias às 06:00 — envia lembretes de tarefas próximas.
  await filaObrigacoes.upsertJobScheduler(
    'lembrar-obrigacoes-proximas',
    { pattern: '0 6 * * *', tz: 'America/Sao_Paulo' },
    { name: 'lembrar', data: {} },
  );

  logger.info('agendadores iniciados (geração mensal, detector diário, lembretes diários)');
}
