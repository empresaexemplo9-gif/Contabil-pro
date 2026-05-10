import { logger } from '@contabilpro/logger';

import type { Job } from 'bullmq';

interface PayloadProcessarDocumento {
  documentoId: string;
  acao: 'OCR' | 'ANTIVIRUS' | 'INDEXAR';
}

export async function processarDocumento(job: Job<PayloadProcessarDocumento>): Promise<void> {
  // TODO: rodar ClamAV, OCR (Tesseract/AWS Textract), indexar para busca.
  logger.info({ jobId: job.id, ...job.data }, 'processando documento (stub)');
}
