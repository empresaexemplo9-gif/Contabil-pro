import { criarApp } from './app.factory';
import { configurarEnv } from './config/env';

/**
 * Entrada para execução tradicional (Node server).
 * Para Vercel/serverless, ver `api/index.ts`.
 */
async function iniciar() {
  const env = configurarEnv();
  const app = await criarApp();
  await app.listen(env.API_PORT);
  console.warn(`[api] escutando em http://localhost:${env.API_PORT}`);
}

iniciar().catch((erro) => {
  console.error('[api] falha ao iniciar', erro);
  process.exit(1);
});
