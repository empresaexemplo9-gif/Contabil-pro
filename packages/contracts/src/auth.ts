import { z } from 'zod';
import { emailSchema } from './comum';

export const loginEntradaSchema = z.object({
  email: emailSchema,
  senha: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(128),
  codigoMfa: z.string().length(6).optional(),
});
export type LoginEntrada = z.infer<typeof loginEntradaSchema>;

export const loginSaidaSchema = z.object({
  tokenAcesso: z.string(),
  tokenRefresh: z.string(),
  expiraEm: z.number().int(),
  exigeMfa: z.boolean().default(false),
});
export type LoginSaida = z.infer<typeof loginSaidaSchema>;

export const refreshEntradaSchema = z.object({
  tokenRefresh: z.string().min(20),
});
export type RefreshEntrada = z.infer<typeof refreshEntradaSchema>;

export const recuperarSenhaSchema = z.object({
  email: emailSchema,
});

export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(20),
    novaSenha: z
      .string()
      .min(10, 'Senha deve ter ao menos 10 caracteres')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
      .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula')
      .regex(/\d/, 'Inclua ao menos um dígito')
      .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um símbolo'),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmacao, {
    message: 'Senhas não conferem',
    path: ['confirmacao'],
  });

export const ativarMfaSchema = z.object({
  codigo: z.string().length(6),
});
