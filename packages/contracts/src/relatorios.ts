import { z } from 'zod';

export const resumoDashboardSchema = z.object({
  totalEmpresas: z.number().int(),
  empresasAtivas: z.number().int(),
  tarefasPendentes: z.number().int(),
  tarefasAtrasadas: z.number().int(),
  tarefasVencendoEm7Dias: z.number().int(),
  conversasAbertas: z.number().int(),
  documentosNoMes: z.number().int(),
  assinaturasPendentes: z.number().int(),
});
export type ResumoDashboard = z.infer<typeof resumoDashboardSchema>;

export const fatiaTarefasStatusSchema = z.object({
  status: z.string(),
  total: z.number().int(),
});
export type FatiaTarefasStatus = z.infer<typeof fatiaTarefasStatusSchema>;

export const fatiaEmpresasRegimeSchema = z.object({
  regime: z.string(),
  total: z.number().int(),
});
export type FatiaEmpresasRegime = z.infer<typeof fatiaEmpresasRegimeSchema>;

export const fatiaConversasCanalSchema = z.object({
  canal: z.string(),
  total: z.number().int(),
});
export type FatiaConversasCanal = z.infer<typeof fatiaConversasCanalSchema>;

export const pontoAtividadeSchema = z.object({
  data: z.string(),
  tarefasConcluidas: z.number().int(),
  documentosEnviados: z.number().int(),
});
export type PontoAtividade = z.infer<typeof pontoAtividadeSchema>;
