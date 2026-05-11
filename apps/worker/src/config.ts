import { z } from 'zod';

const schema = z.object({
  REDIS_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RESEND_API_KEY: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
});

export const env = schema.parse(process.env);

export const NOMES_FILAS = {
  notificacoes: 'notificacoes',
  email: 'email',
  whatsapp: 'whatsapp',
  documentos: 'documentos',
  automacoes: 'automacoes',
  obrigacoes: 'obrigacoes',
  geradorTarefas: 'gerador-tarefas',
  detectorAtrasadas: 'detector-atrasadas',
  assinaturas: 'assinaturas',
} as const;
