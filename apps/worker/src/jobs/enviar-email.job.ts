import { logger } from '@contabilpro/logger';

import type { Job } from 'bullmq';

interface PayloadEmail {
  para: string;
  assunto: string;
  corpoHtml: string;
  corpoTexto?: string;
}

export async function processarEmail(job: Job<PayloadEmail>): Promise<void> {
  // TODO: integrar com Resend (RESEND_API_KEY) ou SES.
  logger.info({ jobId: job.id, para: job.data.para }, 'enviando e-mail (stub)');
}
