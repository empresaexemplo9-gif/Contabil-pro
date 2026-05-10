import { z } from 'zod';
import { idSchema } from './comum.js';

export const criarDocumentoSchema = z.object({
  empresaId: idSchema.optional(),
  categoriaId: idSchema.optional(),
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  tamanhoBytes: z.coerce.number().int().positive().max(500 * 1024 * 1024),
  hashSha256: z.string().length(64),
});
export type CriarDocumentoEntrada = z.infer<typeof criarDocumentoSchema>;

export const presignarUploadSchema = z.object({
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  tamanhoBytes: z.coerce.number().int().positive().max(500 * 1024 * 1024),
});

export const criarSolicitacaoAssinaturaSchema = z.object({
  documentoId: idSchema,
  signatarios: z
    .array(
      z.object({
        nome: z.string().min(2).max(150),
        email: z.string().email(),
        cpf: z.string().optional(),
        ordem: z.number().int().nonnegative().default(0),
      }),
    )
    .min(1)
    .max(20),
  expiraEm: z.coerce.date().optional(),
});
