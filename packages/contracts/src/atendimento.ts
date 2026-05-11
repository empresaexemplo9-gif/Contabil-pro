import { z } from 'zod';

import { idSchema } from './comum';

export const canalConversaSchema = z.enum(['PORTAL', 'EMAIL', 'WHATSAPP']);
export type CanalConversa = z.infer<typeof canalConversaSchema>;

export const statusConversaSchema = z.enum([
  'ABERTA',
  'AGUARDANDO_CLIENTE',
  'EM_ATENDIMENTO',
  'RESOLVIDA',
  'ARQUIVADA',
]);
export type StatusConversa = z.infer<typeof statusConversaSchema>;

export const buscarConversasSchema = z.object({
  termo: z.string().trim().min(1).max(200).optional(),
  status: statusConversaSchema.optional(),
  canal: canalConversaSchema.optional(),
  empresaId: idSchema.optional(),
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().max(100).default(50),
});
export type BuscarConversas = z.infer<typeof buscarConversasSchema>;

export const criarConversaSchema = z.object({
  empresaId: idSchema.optional(),
  canal: canalConversaSchema.default('PORTAL'),
  assunto: z.string().min(2).max(200),
  primeiraMensagem: z.string().min(1).max(5000),
});
export type CriarConversaEntrada = z.infer<typeof criarConversaSchema>;

export const enviarMensagemSchema = z.object({
  texto: z.string().min(1).max(5000),
});
export type EnviarMensagemEntrada = z.infer<typeof enviarMensagemSchema>;

export const mudarStatusConversaSchema = z.object({
  status: statusConversaSchema,
});
export type MudarStatusConversaEntrada = z.infer<typeof mudarStatusConversaSchema>;

export const conversaSchema = z.object({
  id: z.string(),
  escritorioId: z.string(),
  empresaId: z.string().nullable(),
  canal: canalConversaSchema,
  assunto: z.string().nullable(),
  status: statusConversaSchema,
  slaVencimentoEm: z.coerce.date().nullable(),
  ultimaMensagemEm: z.coerce.date().nullable(),
  criadoEm: z.coerce.date(),
});
export type Conversa = z.infer<typeof conversaSchema>;

export const mensagemSchema = z.object({
  id: z.string(),
  conversaId: z.string(),
  remetenteId: z.string().nullable(),
  corpo: z.string(),
  lidaEm: z.coerce.date().nullable(),
  criadoEm: z.coerce.date(),
});
export type Mensagem = z.infer<typeof mensagemSchema>;

// Eventos Socket.IO emitidos pelo servidor.
export const eventosSocket = {
  mensagemNova: 'mensagem.nova',
  conversaAtualizada: 'conversa.atualizada',
} as const;
