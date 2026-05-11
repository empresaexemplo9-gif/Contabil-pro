import { z } from 'zod';

import { idSchema } from './comum';

// --- Eventos de domínio que disparam automações ---

export const tipoGatilhoSchema = z.enum([
  'TAREFA_CRIADA',
  'TAREFA_CONCLUIDA',
  'TAREFA_ATRASADA',
  'DOCUMENTO_ENVIADO',
  'EMPRESA_CADASTRADA',
  'MENSAGEM_RECEBIDA',
]);
export type TipoGatilho = z.infer<typeof tipoGatilhoSchema>;

// --- Condições aplicadas ao payload do evento ---

export const operadorCondicaoSchema = z.enum(['eq', 'neq', 'contains', 'in', 'gt', 'lt']);
export type OperadorCondicao = z.infer<typeof operadorCondicaoSchema>;

export const condicaoSchema = z.object({
  campo: z.string().min(1).max(120),
  operador: operadorCondicaoSchema,
  valor: z.unknown(),
});
export type Condicao = z.infer<typeof condicaoSchema>;

export const gatilhoSchema = z.object({
  tipo: tipoGatilhoSchema,
  condicoes: z.array(condicaoSchema).default([]),
});
export type Gatilho = z.infer<typeof gatilhoSchema>;

// --- Passos / ações ---

export const passoCriarNotificacaoSchema = z.object({
  tipo: z.literal('CRIAR_NOTIFICACAO'),
  config: z.object({
    /** Caminho no contexto que aponta para o usuarioId destinatário. */
    usuarioId: z.string().min(1),
    titulo: z.string().min(1).max(200),
    corpo: z.string().min(1).max(2000),
    /** TipoNotificacao do enum Prisma. */
    tipo: z
      .enum([
        'TAREFA_ATRIBUIDA',
        'TAREFA_VENCENDO',
        'DOCUMENTO_NOVO',
        'ASSINATURA_PENDENTE',
        'ASSINATURA_CONCLUIDA',
        'MENSAGEM_NOVA',
        'AUTOMACAO_FALHOU',
        'SISTEMA',
      ])
      .default('SISTEMA'),
  }),
});

export const passoEnviarEmailSchema = z.object({
  tipo: z.literal('ENVIAR_EMAIL'),
  config: z.object({
    para: z.string().min(3),
    assunto: z.string().min(1).max(200),
    corpoHtml: z.string().min(1).max(20000),
    corpoTexto: z.string().max(20000).optional(),
  }),
});

export const passoEnviarWhatsappSchema = z.object({
  tipo: z.literal('ENVIAR_WHATSAPP'),
  config: z.object({
    para: z.string().min(8).max(20),
    texto: z.string().min(1).max(4000),
  }),
});

export const passoCriarTarefaSchema = z.object({
  tipo: z.literal('CRIAR_TAREFA'),
  config: z.object({
    titulo: z.string().min(1).max(200),
    descricao: z.string().max(2000).optional(),
    /** ISO date string ou template (ex.: "{{tarefa.dataVencimento}}"). */
    dataVencimento: z.string().min(1),
    empresaId: z.string().optional(),
    responsavelId: z.string().optional(),
    prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  }),
});

export const passoSchema = z.discriminatedUnion('tipo', [
  passoCriarNotificacaoSchema,
  passoEnviarEmailSchema,
  passoEnviarWhatsappSchema,
  passoCriarTarefaSchema,
]);
export type Passo = z.infer<typeof passoSchema>;
export type TipoPasso = Passo['tipo'];

// --- Automação completa ---

export const criarAutomacaoSchema = z.object({
  nome: z.string().min(2).max(120),
  descricao: z.string().max(500).optional(),
  gatilho: gatilhoSchema,
  passos: z.array(passoSchema).min(1).max(20),
  ativar: z.boolean().default(false),
});
export type CriarAutomacaoEntrada = z.infer<typeof criarAutomacaoSchema>;

export const atualizarAutomacaoSchema = criarAutomacaoSchema.partial();
export type AtualizarAutomacaoEntrada = z.infer<typeof atualizarAutomacaoSchema>;

export const automacaoSchema = z.object({
  id: z.string(),
  escritorioId: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  gatilho: gatilhoSchema,
  passos: z.array(passoSchema),
  status: z.enum(['ATIVA', 'PAUSADA', 'RASCUNHO']),
  criadoEm: z.coerce.date(),
  atualizadoEm: z.coerce.date(),
});
export type Automacao = z.infer<typeof automacaoSchema>;

// --- Eventos dispatched (entrada do motor) ---

export const eventoDispatchSchema = z.object({
  tipo: tipoGatilhoSchema,
  escritorioId: idSchema,
  /** Payload livre — convertido em contexto para templates. */
  payload: z.record(z.string(), z.unknown()),
});
export type EventoDispatch = z.infer<typeof eventoDispatchSchema>;
