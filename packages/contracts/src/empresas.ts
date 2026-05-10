import { z } from 'zod';
import { cnpjSchema, emailSchema, telefoneSchema } from './comum.js';

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
