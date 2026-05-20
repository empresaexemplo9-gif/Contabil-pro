/**
 * Helper standalone para gerar URLs de download via Vercel Blob.
 * Usado em jobs (fora do contexto NestJS) — para uso em controllers/
 * services, prefira `ArmazenamentoServico` (com DI).
 */
import { configurarEnv } from '../../config/env';

export function gerarUrlDownload(chave: string): string {
  const env = configurarEnv();
  if (!env.BLOB_PUBLIC_URL) {
    throw new Error('BLOB_PUBLIC_URL não definida — copie da aba Storage do Vercel');
  }
  return `${env.BLOB_PUBLIC_URL.replace(/\/$/, '')}/${chave}`;
}
