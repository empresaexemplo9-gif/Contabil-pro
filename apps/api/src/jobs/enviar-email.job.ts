import { logger } from '@contabilpro/logger';
import { z } from 'zod';

export const PayloadEmail = z.object({
  para: z.string().email(),
  assunto: z.string().min(1),
  corpoHtml: z.string().min(1),
  corpoTexto: z.string().optional(),
});
export type PayloadEmail = z.infer<typeof PayloadEmail>;

export async function processarEmail(payloadBruto: unknown): Promise<void> {
  const payload = PayloadEmail.parse(payloadBruto);
  // TODO: integrar com Resend (RESEND_API_KEY) ou SES.
  logger.info({ para: payload.para, assunto: payload.assunto }, 'enviando e-mail (stub)');
}
