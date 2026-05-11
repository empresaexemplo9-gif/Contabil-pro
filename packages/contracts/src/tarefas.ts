import { z } from 'zod';

import { idSchema } from './comum';
import { regimeTributarioSchema } from './empresas';

// --- Tarefas ---

export const prioridadeTarefaSchema = z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']);
export type PrioridadeTarefa = z.infer<typeof prioridadeTarefaSchema>;

export const statusTarefaSchema = z.enum([
  'PENDENTE',
  'EM_ANDAMENTO',
  'CONCLUIDA',
  'ATRASADA',
  'CANCELADA',
]);
export type StatusTarefa = z.infer<typeof statusTarefaSchema>;

export const criarTarefaSchema = z.object({
  empresaId: idSchema.optional(),
  modeloId: idSchema.optional(),
  titulo: z.string().min(2).max(200),
  descricao: z.string().max(2000).optional(),
  prioridade: prioridadeTarefaSchema.default('MEDIA'),
  dataVencimento: z.coerce.date(),
  responsavelId: idSchema.optional(),
});
export type CriarTarefaEntrada = z.infer<typeof criarTarefaSchema>;

export const atualizarTarefaSchema = criarTarefaSchema.partial().extend({
  status: statusTarefaSchema.optional(),
});
export type AtualizarTarefaEntrada = z.infer<typeof atualizarTarefaSchema>;

export const buscarTarefasSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().max(100).default(50),
  termo: z.string().trim().min(1).max(200).optional(),
  status: statusTarefaSchema.optional(),
  prioridade: prioridadeTarefaSchema.optional(),
  empresaId: idSchema.optional(),
  responsavelId: idSchema.optional(),
  modeloId: idSchema.optional(),
  vencendoEm: z.coerce.number().int().positive().max(365).optional(),
  ordenarPor: z.enum(['dataVencimento', 'prioridade', 'criadoEm']).default('dataVencimento'),
  ordem: z.enum(['asc', 'desc']).default('asc'),
});
export type BuscarTarefas = z.infer<typeof buscarTarefasSchema>;

export const tarefaSchema = z.object({
  id: z.string(),
  escritorioId: z.string(),
  empresaId: z.string().nullable(),
  modeloId: z.string().nullable(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  prioridade: prioridadeTarefaSchema,
  status: statusTarefaSchema,
  dataVencimento: z.coerce.date(),
  concluidaEm: z.coerce.date().nullable(),
  responsavelId: z.string().nullable(),
  criadoEm: z.coerce.date(),
  atualizadoEm: z.coerce.date(),
});
export type Tarefa = z.infer<typeof tarefaSchema>;

// --- Modelos de obrigação ---

export const frequenciaObrigacaoSchema = z.enum([
  'UNICA',
  'MENSAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
]);
export type FrequenciaObrigacao = z.infer<typeof frequenciaObrigacaoSchema>;

export const criarModeloObrigacaoSchema = z.object({
  nome: z.string().min(2).max(120),
  descricao: z.string().max(500).optional(),
  frequencia: frequenciaObrigacaoSchema,
  diaVencimento: z.coerce.number().int().min(1).max(31).optional(),
  regimes: z.array(regimeTributarioSchema).default([]),
  ativo: z.boolean().default(true),
});
export type CriarModeloObrigacaoEntrada = z.infer<typeof criarModeloObrigacaoSchema>;

export const atualizarModeloObrigacaoSchema = criarModeloObrigacaoSchema.partial();
export type AtualizarModeloObrigacaoEntrada = z.infer<typeof atualizarModeloObrigacaoSchema>;

export const modeloObrigacaoSchema = z.object({
  id: z.string(),
  escritorioId: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  frequencia: frequenciaObrigacaoSchema,
  diaVencimento: z.number().int().nullable(),
  regimes: z.array(regimeTributarioSchema),
  ativo: z.boolean(),
  criadoEm: z.coerce.date(),
});
export type ModeloObrigacao = z.infer<typeof modeloObrigacaoSchema>;

export const gerarTarefasSchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2000).max(2100),
  responsavelId: idSchema.optional(),
  prioridade: prioridadeTarefaSchema.default('MEDIA'),
});
export type GerarTarefasEntrada = z.infer<typeof gerarTarefasSchema>;
