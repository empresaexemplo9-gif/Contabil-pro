/**
 * Helpers para handlers de jobs/crons rodando como funções Vercel.
 *
 * - `criarHandlerQStash`: verifica `Upstash-Signature` antes de chamar o
 *   handler. Usado pelos jobs em `apps/api/api/jobs/*.ts`.
 * - `criarHandlerCron`: verifica `Authorization: Bearer ${CRON_SECRET}`
 *   (header que o Vercel Cron envia). Usado pelos crons em
 *   `apps/api/api/cron/*.ts`.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

import { Receiver } from '@upstash/qstash';

let receiverCache: Receiver | null | undefined;

function obterReceiver(): Receiver | null {
  if (receiverCache !== undefined) return receiverCache;
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const next = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!current || !next) {
    receiverCache = null;
    return null;
  }
  receiverCache = new Receiver({ currentSigningKey: current, nextSigningKey: next });
  return receiverCache;
}

async function lerCorpoBruto(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

type Handler<T> = (payload: T) => Promise<unknown>;

export function criarHandlerQStash<T = unknown>(handler: Handler<T>) {
  return async function (req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    const receiver = obterReceiver();
    const corpo = await lerCorpoBruto(req);

    // Em produção (com QStash configurado), assinatura é obrigatória.
    if (receiver) {
      const assinatura = req.headers['upstash-signature'];
      if (typeof assinatura !== 'string') {
        res.statusCode = 401;
        res.end('Missing Upstash-Signature header');
        return;
      }
      try {
        const valido = await receiver.verify({ signature: assinatura, body: corpo });
        if (!valido) throw new Error('assinatura inválida');
      } catch (erro) {
        res.statusCode = 401;
        res.end(`Invalid signature: ${(erro as Error).message}`);
        return;
      }
    }
    // Sem receiver (dev sem QSTASH_*_SIGNING_KEY), aceita request sem
    // verificação — útil pra debugar local mas NÃO seguro em prod.

    let payload: T;
    try {
      payload = (corpo ? JSON.parse(corpo) : {}) as T;
    } catch {
      res.statusCode = 400;
      res.end('Invalid JSON body');
      return;
    }

    try {
      const resultado = await handler(payload);
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, resultado: resultado ?? null }));
    } catch (erro) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, erro: (erro as Error).message }));
    }
  };
}

export function criarHandlerCron(handler: () => Promise<unknown>) {
  return async function (req: IncomingMessage, res: ServerResponse): Promise<void> {
    const segredo = process.env.CRON_SECRET;
    if (segredo) {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${segredo}`) {
        res.statusCode = 401;
        res.end('Unauthorized');
        return;
      }
    }

    try {
      const resultado = await handler();
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, resultado: resultado ?? null }));
    } catch (erro) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, erro: (erro as Error).message }));
    }
  };
}
