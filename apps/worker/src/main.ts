import { logger } from '@contabilpro/logger';
import { Queue, Worker, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';


import { iniciarAgendadores } from './agendadores/index.js';
import { env, NOMES_FILAS } from './config.js';
import { detectarAtrasadas } from './jobs/detectar-atrasadas.job.js';
import { enviarAssinatura } from './jobs/enviar-assinatura.job.js';
import { processarEmail } from './jobs/enviar-email.job.js';
import { processarNotificacao } from './jobs/enviar-notificacao.job.js';
import { processarWhatsapp } from './jobs/enviar-whatsapp.job.js';
import { executarAutomacao } from './jobs/executar-automacao.job.js';
import { gerarTarefasAutomaticas } from './jobs/gerar-tarefas-automaticas.job.js';
import { criarLembrarObrigacao } from './jobs/lembrar-obrigacao.job.js';
import { processarDocumento } from './jobs/processar-documento.job.js';

const conexao = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const opcoesBase: WorkerOptions = {
  connection: conexao,
  concurrency: 5,
};

// Filas de enfileiramento que o job de lembretes precisa para fan-out.
const filaNotificacoes = new Queue(NOMES_FILAS.notificacoes, { connection: conexao });
const filaEmail = new Queue(NOMES_FILAS.email, { connection: conexao });

const lembrarObrigacao = criarLembrarObrigacao({ filaNotificacoes, filaEmail });

const workers: Worker[] = [
  new Worker(NOMES_FILAS.email, processarEmail, opcoesBase),
  new Worker(NOMES_FILAS.whatsapp, processarWhatsapp, opcoesBase),
  new Worker(NOMES_FILAS.documentos, processarDocumento, opcoesBase),
  new Worker(NOMES_FILAS.automacoes, executarAutomacao, opcoesBase),
  new Worker(NOMES_FILAS.obrigacoes, lembrarObrigacao, opcoesBase),
  new Worker(NOMES_FILAS.notificacoes, processarNotificacao, opcoesBase),
  new Worker(NOMES_FILAS.geradorTarefas, gerarTarefasAutomaticas, { ...opcoesBase, concurrency: 1 }),
  new Worker(NOMES_FILAS.detectorAtrasadas, detectarAtrasadas, { ...opcoesBase, concurrency: 1 }),
  new Worker(NOMES_FILAS.assinaturas, enviarAssinatura, opcoesBase),
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
  await filaNotificacoes.close();
  await filaEmail.close();
  await conexao.quit();
  process.exit(0);
}

process.on('SIGTERM', desligar);
process.on('SIGINT', desligar);
