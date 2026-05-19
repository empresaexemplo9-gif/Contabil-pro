/**
 * Ponto de entrada do NestJS quando rodando no Vercel (Serverless Functions).
 *
 * A `vercel.json` de `apps/api` faz rewrite de todo path para `/api` →
 * este arquivo. Cada cold-start cria a instância NestJS uma única vez e
 * reaproveita entre invocações enquanto o container ficar vivo.
 *
 * Para o modo tradicional (Node server) ver `src/main.ts`.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { criarApp } from '../src/app.factory';

let appPromise: Promise<INestApplication> | null = null;

async function obterApp(): Promise<INestApplication> {
  if (!appPromise) {
    appPromise = criarApp().then(async (app) => {
      await app.init();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = (await obterApp()) as NestExpressApplication;
  const express = app.getHttpAdapter().getInstance();
  // Encaminha o request bruto pro Express subjacente do NestJS.
  return express(req, res);
}
