import { enviarEmailResend } from '@contabilpro/integracoes';
import { logger } from '@contabilpro/logger';
import { z } from 'zod';

import { configurarEnv } from '../config/env';

export const PayloadEmail = z.object({
  para: z.string().email(),
  assunto: z.string().min(1),
  corpoHtml: z.string().min(1),
  corpoTexto: z.string().optional(),
  /** Remetente opcional — cai no EMAIL_REMETENTE_PADRAO quando ausente. */
  de: z.string().optional(),
});
export type PayloadEmail = z.infer<typeof PayloadEmail>;

export async function processarEmail(payloadBruto: unknown): Promise<void> {
  const payload = PayloadEmail.parse(payloadBruto);
  const env = configurarEnv();

  const de = payload.de ?? env.EMAIL_REMETENTE_PADRAO;

  // Sem credenciais (dev local) ou sem remetente: não enviamos de verdade,
  // apenas registramos. Mantém o fluxo testável sem provedor configurado.
  if (!env.RESEND_API_KEY || !de) {
    logger.warn(
      { para: payload.para, assunto: payload.assunto },
      'RESEND_API_KEY/EMAIL_REMETENTE_PADRAO ausente — e-mail não enviado (stub)',
    );
    return;
  }

  const { externalId } = await enviarEmailResend(
    { apiKey: env.RESEND_API_KEY },
    {
      de,
      para: payload.para,
      assunto: payload.assunto,
      corpoHtml: payload.corpoHtml,
      corpoTexto: payload.corpoTexto,
    },
  );

  logger.info({ para: payload.para, assunto: payload.assunto, externalId }, 'e-mail enviado');
}
