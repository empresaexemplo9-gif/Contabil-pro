import { z } from 'zod';
import { idSchema } from './comum.js';

export const prioridadeTarefaSchema = z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']);
export const statusTarefaSchema = z.enum([
  'PENDENTE',
  'EM_ANDAMENTO',
  'CONCLUIDA',
  'ATRASADA',
  'CANCELADA',
]);

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
