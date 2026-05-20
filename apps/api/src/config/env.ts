import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // PORT (convenção PaaS) tem prioridade sobre API_PORT (compatibilidade local).
  API_PORT: z.coerce.number().int().positive().default(3333),
  PORT: z.coerce.number().int().positive().optional(),
  API_URL: z.string().url(),
  WEB_URL: z.string().url(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),

  // Upstash QStash — fila HTTP usada no lugar do BullMQ quando rodando
  // serverless (Vercel). Em dev local sem QSTASH_TOKEN, os jobs rodam
  // inline (síncronos) — útil pra teste mas não escala.
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
  // Vercel Cron envia este header pra autenticar invocações agendadas.
  CRON_SECRET: z.string().optional(),

  JWT_PRIVATE_KEY: z.string().min(20),
  JWT_PUBLIC_KEY: z.string().min(20),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  // Storage S3-compatível — opcional para permitir subir sem provedor ainda
  // (upload/download de documentos ficam desativados até preencher).
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_REMETENTE_PADRAO: z.string().email().optional(),

  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),

  ASSINATURA_PROVEDOR: z.enum(['zapsign', 'clicksign', 'd4sign']).default('zapsign'),
  ZAPSIGN_API_TOKEN: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

let cache: Env | null = null;

export function configurarEnv(): Env {
  if (cache) return cache;
  const resultado = envSchema.safeParse(process.env);
  if (!resultado.success) {
    console.error('[env] variáveis inválidas:', resultado.error.flatten().fieldErrors);
    throw new Error('Configuração de ambiente inválida');
  }
  const dados = resultado.data;
  if (dados.PORT) dados.API_PORT = dados.PORT;
  cache = dados;
  return cache;
}
