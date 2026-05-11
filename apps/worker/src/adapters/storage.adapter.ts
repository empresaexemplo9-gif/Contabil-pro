/**
 * Cliente S3 do worker para gerar URLs presignadas de download.
 * Mantemos uma instância singleton entre jobs para reaproveitar conexão.
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

const schema = z.object({
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

const env = schema.parse(process.env);

const cliente = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
});

export async function gerarUrlDownload(chave: string, ttlSegundos = 900): Promise<string> {
  const comando = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: chave });
  return getSignedUrl(cliente, comando, { expiresIn: ttlSegundos });
}
