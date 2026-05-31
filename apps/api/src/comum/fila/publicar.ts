/**
 * Núcleo de publicação de jobs assíncronos, **sem** dependência dos handlers.
 *
 * Mantê-lo separado de `fila.ts` quebra o ciclo de import: os jobs importam
 * `publicarJob` daqui, enquanto `fila.ts` (que conhece os handlers) apenas
 * os registra via `registrarHandlerInline`.
 *
 * Modos de operação:
 * - **Produção (QSTASH_TOKEN definido)**: enfileira via QStash REST, que
 *   então POSTa pra função Vercel correspondente (`apps/api/api/jobs/<nome>.ts`).
 * - **Dev local (sem QSTASH_TOKEN)**: executa o handler registrado inline,
 *   sincronamente.
 */
import { Client as QStashClient } from '@upstash/qstash';

import { configurarEnv } from '../../config/env';

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

type HandlerInline = (payload: unknown) => Promise<unknown>;

// Registro de handlers para execução inline em dev. Populado por `fila.ts`,
// que é carregado no bootstrap (via FilaModule).
const handlersInline = new Map<NomeJob, HandlerInline>();

/** Registra o handler usado na execução inline (dev sem QStash). */
export function registrarHandlerInline(nome: NomeJob, handler: HandlerInline): void {
  handlersInline.set(nome, handler);
}

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
    const handler = handlersInline.get(nome);
    if (!handler) {
      throw new Error(
        `Handler inline não registrado para o job "${nome}". ` +
          'Garanta que o módulo de fila (FilaModule) foi carregado no bootstrap.',
      );
    }
    await handler(payload);
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
