/**
 * Publisher unificado para jobs assíncronos. Substitui o produtor BullMQ
 * por publicações HTTP no Upstash QStash, que então POSTa pra função
 * Vercel correspondente (ver `apps/api/api/jobs/<nome>.ts`).
 *
 * Modos de operação:
 * - **Produção (QSTASH_TOKEN definido)**: enfileira via QStash REST.
 * - **Dev local (sem QSTASH_TOKEN)**: executa o handler inline,
 *   sincronamente. Útil pra integração local mas não escala — basta
 *   apontar QSTASH_TOKEN pra Upstash free tier pra ter comportamento
 *   idêntico ao prod.
 */
import { Client as QStashClient } from '@upstash/qstash';

import { configurarEnv } from '../../config/env';
import { detectarAtrasadas } from '../../jobs/detectar-atrasadas.job';
import { enviarAssinatura } from '../../jobs/enviar-assinatura.job';
import { processarEmail } from '../../jobs/enviar-email.job';
import { processarNotificacao } from '../../jobs/enviar-notificacao.job';
import { processarWhatsapp } from '../../jobs/enviar-whatsapp.job';
import { executarAutomacao } from '../../jobs/executar-automacao.job';
import { gerarTarefasAutomaticas } from '../../jobs/gerar-tarefas-automaticas.job';
import { lembrarObrigacoes } from '../../jobs/lembrar-obrigacao.job';
import { processarDocumento } from '../../jobs/processar-documento.job';

export type NomeJob =
  | 'enviar-email'
  | 'enviar-whatsapp'
  | 'enviar-notificacao'
  | 'enviar-assinatura'
  | 'processar-documento'
  | 'executar-automacao'
  | 'detectar-atrasadas'
  | 'gerar-tarefas-automaticas'
  | 'lembrar-obrigacoes';

// Mapa de handlers para execução inline em dev. Cada função aceita
// `payload: unknown` e faz parse interno via Zod.
const HANDLERS_INLINE: Record<NomeJob, (payload: unknown) => Promise<unknown>> = {
  'enviar-email': (p) => processarEmail(p),
  'enviar-whatsapp': (p) => processarWhatsapp(p),
  'enviar-notificacao': (p) => processarNotificacao(p),
  'enviar-assinatura': (p) => enviarAssinatura(p),
  'processar-documento': (p) => processarDocumento(p),
  'executar-automacao': (p) => executarAutomacao(p),
  'detectar-atrasadas': () => detectarAtrasadas(),
  'gerar-tarefas-automaticas': (p) => gerarTarefasAutomaticas(p),
  'lembrar-obrigacoes': () => lembrarObrigacoes(),
};

interface OpcoesPublicacao {
  /** Atraso em segundos antes da entrega (QStash delay). */
  delaySegundos?: number;
  /** Número máximo de retentativas no QStash. */
  tentativas?: number;
}

let clienteCache: QStashClient | null | undefined;

function obterCliente(): QStashClient | null {
  if (clienteCache !== undefined) return clienteCache;
  const env = configurarEnv();
  clienteCache = env.QSTASH_TOKEN ? new QStashClient({ token: env.QSTASH_TOKEN }) : null;
  return clienteCache;
}

export async function publicarJob<T>(
  nome: NomeJob,
  payload: T,
  opcoes: OpcoesPublicacao = {},
): Promise<void> {
  const cliente = obterCliente();
  const env = configurarEnv();

  if (!cliente) {
    // Fallback dev: executa síncrono. Erros propagam pro chamador.
    await HANDLERS_INLINE[nome](payload);
    return;
  }

  const url = `${env.API_URL.replace(/\/$/, '')}/api/jobs/${nome}`;
  await cliente.publishJSON({
    url,
    body: payload as Record<string, unknown>,
    delay: opcoes.delaySegundos,
    retries: opcoes.tentativas ?? 3,
  });
}
