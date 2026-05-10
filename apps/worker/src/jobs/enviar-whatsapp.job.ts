import { logger } from '@contabilpro/logger';

import type { Job } from 'bullmq';

interface PayloadWhatsapp {
  para: string;
  template?: string;
  variaveis?: Record<string, string>;
  texto?: string;
}

export async function processarWhatsapp(job: Job<PayloadWhatsapp>): Promise<void> {
  // TODO: integrar com WhatsApp Cloud API (Meta Graph).
  logger.info({ jobId: job.id, para: job.data.para }, 'enviando whatsapp (stub)');
}
