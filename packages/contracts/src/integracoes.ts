import { z } from 'zod';

export const provedorIntegracaoSchema = z.enum([
  'WHATSAPP_CLOUD',
  'RESEND',
  'ZAPSIGN',
  'CLICKSIGN',
  'D4SIGN',
  'CUSTOMIZADA',
]);
export type ProvedorIntegracao = z.infer<typeof provedorIntegracaoSchema>;

export const statusIntegracaoSchema = z.enum(['ATIVA', 'INATIVA', 'ERRO']);
export type StatusIntegracao = z.infer<typeof statusIntegracaoSchema>;

const credenciaisWhatsappSchema = z.object({
  phoneNumberId: z.string().min(5),
  token: z.string().min(20),
  verifyToken: z.string().min(8).optional(),
});

const credenciaisGenericasSchema = z.record(z.string(), z.string());

export const criarIntegracaoSchema = z.discriminatedUnion('provedor', [
  z.object({
    provedor: z.literal('WHATSAPP_CLOUD'),
    nome: z.string().min(2).max(80),
    credenciais: credenciaisWhatsappSchema,
    configuracoes: z.record(z.string(), z.unknown()).default({}),
    ativar: z.boolean().default(true),
  }),
  z.object({
    provedor: z.enum(['RESEND', 'ZAPSIGN', 'CLICKSIGN', 'D4SIGN', 'CUSTOMIZADA']),
    nome: z.string().min(2).max(80),
    credenciais: credenciaisGenericasSchema,
    configuracoes: z.record(z.string(), z.unknown()).default({}),
    ativar: z.boolean().default(true),
  }),
]);
export type CriarIntegracaoEntrada = z.infer<typeof criarIntegracaoSchema>;

export const integracaoResumoSchema = z.object({
  id: z.string(),
  provedor: provedorIntegracaoSchema,
  nome: z.string(),
  status: statusIntegracaoSchema,
  ultimoErro: z.string().nullable(),
  criadoEm: z.coerce.date(),
});
export type IntegracaoResumo = z.infer<typeof integracaoResumoSchema>;
