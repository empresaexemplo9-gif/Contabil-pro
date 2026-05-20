import { logger } from '@contabilpro/logger';
import { z } from 'zod';

export const PayloadProcessarDocumento = z.object({
  documentoId: z.string().uuid(),
  acao: z.enum(['OCR', 'ANTIVIRUS', 'INDEXAR']),
});
export type PayloadProcessarDocumento = z.infer<typeof PayloadProcessarDocumento>;

export async function processarDocumento(payloadBruto: unknown): Promise<void> {
  const payload = PayloadProcessarDocumento.parse(payloadBruto);
  // TODO: rodar ClamAV, OCR (Tesseract/AWS Textract), indexar para busca.
  logger.info(payload, 'processando documento (stub)');
}
