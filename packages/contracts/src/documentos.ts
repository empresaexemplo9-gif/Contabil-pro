import { z } from 'zod';

import { idSchema } from './comum';

export const statusDocumentoSchema = z.enum(['ATIVO', 'ARQUIVADO', 'EXCLUIDO']);
export type StatusDocumento = z.infer<typeof statusDocumentoSchema>;

// --- Categorias ---

export const criarCategoriaDocumentoSchema = z.object({
  nome: z.string().min(2).max(80),
  descricao: z.string().max(300).optional(),
  diasRetencao: z.coerce.number().int().positive().max(36_500).optional(),
});
export type CriarCategoriaDocumentoEntrada = z.infer<typeof criarCategoriaDocumentoSchema>;

export const atualizarCategoriaDocumentoSchema = criarCategoriaDocumentoSchema.partial();

export const categoriaDocumentoSchema = z.object({
  id: z.string(),
  escritorioId: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  diasRetencao: z.number().int().nullable(),
  criadoEm: z.coerce.date(),
});
export type CategoriaDocumento = z.infer<typeof categoriaDocumentoSchema>;

// --- Upload / criação ---

const TAMANHO_MAX_BYTES = 500 * 1024 * 1024;

export const presignarUploadSchema = z.object({
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  tamanhoBytes: z.coerce.number().int().positive().max(TAMANHO_MAX_BYTES),
});
export type PresignarUploadEntrada = z.infer<typeof presignarUploadSchema>;

export const criarDocumentoSchema = z.object({
  empresaId: idSchema.optional(),
  categoriaId: idSchema.optional(),
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  tamanhoBytes: z.coerce.number().int().positive().max(TAMANHO_MAX_BYTES),
  hashSha256: z.string().length(64),
  chaveStorage: z.string().min(1).max(500),
});
export type CriarDocumentoEntrada = z.infer<typeof criarDocumentoSchema>;

export const criarVersaoDocumentoSchema = z.object({
  mimeType: z.string().min(1).max(150),
  tamanhoBytes: z.coerce.number().int().positive().max(TAMANHO_MAX_BYTES),
  hashSha256: z.string().length(64),
  chaveStorage: z.string().min(1).max(500),
  notas: z.string().max(500).optional(),
});
export type CriarVersaoDocumentoEntrada = z.infer<typeof criarVersaoDocumentoSchema>;

// --- Busca / listagem ---

export const buscarDocumentosSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().max(100).default(20),
  termo: z.string().trim().min(1).max(200).optional(),
  empresaId: idSchema.optional(),
  categoriaId: idSchema.optional(),
  status: statusDocumentoSchema.default('ATIVO'),
  ordenarPor: z.enum(['criadoEm', 'nome']).default('criadoEm'),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});
export type BuscarDocumentos = z.infer<typeof buscarDocumentosSchema>;

// --- Saída ---

export const documentoSchema = z.object({
  id: z.string(),
  escritorioId: z.string(),
  empresaId: z.string().nullable(),
  categoriaId: z.string().nullable(),
  nome: z.string(),
  mimeType: z.string(),
  tamanhoBytes: z.coerce.number(),
  chaveStorage: z.string(),
  hashSha256: z.string(),
  versaoAtual: z.number().int(),
  status: statusDocumentoSchema,
  criadoEm: z.coerce.date(),
  atualizadoEm: z.coerce.date(),
});
export type Documento = z.infer<typeof documentoSchema>;

export const versaoDocumentoSchema = z.object({
  id: z.string(),
  documentoId: z.string(),
  versao: z.number().int(),
  chaveStorage: z.string(),
  hashSha256: z.string(),
  tamanhoBytes: z.coerce.number(),
  notas: z.string().nullable(),
  criadoEm: z.coerce.date(),
});
export type VersaoDocumento = z.infer<typeof versaoDocumentoSchema>;

// --- Assinaturas ---

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
