/**
 * Helper standalone para gerar URLs presignadas de download.
 * Usado em jobs (fora do contexto NestJS) — para uso em controllers/
 * services, prefira `ArmazenamentoServico` (com DI e validação de erro).
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { configurarEnv } from '../../config/env';

let clienteCache: S3Client | null | undefined;
let bucketCache: string | null | undefined;

function obterCliente(): { cliente: S3Client; bucket: string } {
  if (clienteCache === undefined) {
    const env = configurarEnv();
    if (env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY) {
      clienteCache = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY,
        },
      });
      bucketCache = env.S3_BUCKET;
    } else {
      clienteCache = null;
      bucketCache = null;
    }
  }
  if (!clienteCache || !bucketCache) {
    throw new Error(
      'Storage S3 não configurado (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY)',
    );
  }
  return { cliente: clienteCache, bucket: bucketCache };
}

export async function gerarUrlDownload(chave: string, ttlSegundos = 900): Promise<string> {
  const { cliente, bucket } = obterCliente();
  const comando = new GetObjectCommand({ Bucket: bucket, Key: chave });
  return getSignedUrl(cliente, comando, { expiresIn: ttlSegundos });
}
