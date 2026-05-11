import { z } from 'zod';
import { cnpjSchema, emailSchema, telefoneSchema } from './comum';

export const regimeTributarioSchema = z.enum([
  'SIMPLES_NACIONAL',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
  'MEI',
  'IMUNE_ISENTO',
]);

export const enderecoSchema = z.object({
  logradouro: z.string().max(200),
  numero: z.string().max(20),
  complemento: z.string().max(100).optional(),
  bairro: z.string().max(100),
  cidade: z.string().max(100),
  uf: z.string().length(2),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
});

export const criarEmpresaSchema = z.object({
  cnpj: cnpjSchema,
  razaoSocial: z.string().min(2).max(200),
  nomeFantasia: z.string().max(200).optional(),
  inscricaoEstadual: z.string().max(20).optional(),
  inscricaoMunicipal: z.string().max(20).optional(),
  regime: regimeTributarioSchema,
  dataAbertura: z.coerce.date().optional(),
  endereco: enderecoSchema.optional(),
  observacoes: z.string().max(2000).optional(),
});
export type CriarEmpresaEntrada = z.infer<typeof criarEmpresaSchema>;

export const atualizarEmpresaSchema = criarEmpresaSchema.partial();

export const criarContatoEmpresaSchema = z.object({
  nome: z.string().min(2).max(150),
  email: emailSchema.optional(),
  telefone: telefoneSchema.optional(),
  cargo: z.string().max(100).optional(),
  principal: z.boolean().default(false),
});
export type CriarContatoEmpresaEntrada = z.infer<typeof criarContatoEmpresaSchema>;

export const statusEmpresaSchema = z.enum(['ATIVA', 'INATIVA', 'ENCERRADA']);
export type StatusEmpresa = z.infer<typeof statusEmpresaSchema>;
export type RegimeTributario = z.infer<typeof regimeTributarioSchema>;

export const buscarEmpresasSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().max(100).default(20),
  termo: z.string().trim().min(1).max(200).optional(),
  regime: regimeTributarioSchema.optional(),
  status: statusEmpresaSchema.optional(),
  ordenarPor: z.enum(['criadoEm', 'razaoSocial', 'cnpj']).default('criadoEm'),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});
export type BuscarEmpresas = z.infer<typeof buscarEmpresasSchema>;

export const empresaSchema = z.object({
  id: z.string(),
  escritorioId: z.string(),
  cnpj: z.string(),
  razaoSocial: z.string(),
  nomeFantasia: z.string().nullable(),
  inscricaoEstadual: z.string().nullable(),
  inscricaoMunicipal: z.string().nullable(),
  regime: regimeTributarioSchema,
  status: statusEmpresaSchema,
  dataAbertura: z.coerce.date().nullable(),
  endereco: enderecoSchema.nullable(),
  observacoes: z.string().nullable(),
  criadoEm: z.coerce.date(),
  atualizadoEm: z.coerce.date(),
});
export type Empresa = z.infer<typeof empresaSchema>;

export const contatoEmpresaSchema = z.object({
  id: z.string(),
  empresaId: z.string(),
  nome: z.string(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  cargo: z.string().nullable(),
  principal: z.boolean(),
  criadoEm: z.coerce.date(),
});
export type ContatoEmpresa = z.infer<typeof contatoEmpresaSchema>;
