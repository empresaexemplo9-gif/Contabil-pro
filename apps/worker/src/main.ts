import { Worker, type WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';

import { logger } from '@contabilpro/logger';

import { env, NOMES_FILAS } from './config.js';
import { processarEmail } from './jobs/enviar-email.job.js';
import { processarWhatsapp } from './jobs/enviar-whatsapp.job.js';
import { processarDocumento } from './jobs/processar-documento.job.js';
import { executarAutomacao } from './jobs/executar-automacao.job.js';
import { lembrarObrigacao } from './jobs/lembrar-obrigacao.job.js';
import { processarNotificacao } from './jobs/enviar-notificacao.job.js';
import { iniciarAgendadores } from './agendadores/index.js';

const conexao = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const opcoesBase: WorkerOptions = {
  connection: conexao,
  concurrency: 5,
};

const workers: Worker[] = [
  new Worker(NOMES_FILAS.email, processarEmail, opcoesBase),
  new Worker(NOMES_FILAS.whatsapp, processarWhatsapp, opcoesBase),
  new Worker(NOMES_FILAS.documentos, processarDocumento, opcoesBase),
  new Worker(NOMES_FILAS.automacoes, executarAutomacao, opcoesBase),
  new Worker(NOMES_FILAS.obrigacoes, lembrarObrigacao, opcoesBase),
  new Worker(NOMES_FILAS.notificacoes, processarNotificacao, opcoesBase),
];

for (const w of workers) {
  w.on('completed', (job) => logger.debug({ fila: w.name, jobId: job.id }, 'job concluído'));
  w.on('failed', (job, erro) =>
    logger.error({ fila: w.name, jobId: job?.id, erro: erro?.message }, 'job falhou'),
  );
}

void iniciarAgendadores(conexao);

logger.info({ filas: workers.map((w) => w.name) }, 'worker do ContabilPro iniciado');

async function desligar(): Promise<void> {
  logger.warn('encerrando workers...');
  await Promise.all(workers.map((w) => w.close()));
  await conexao.quit();
  process.exit(0);
}

process.on('SIGTERM', desligar);
process.on('SIGINT', desligar);
