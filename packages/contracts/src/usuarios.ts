import { z } from 'zod';

import { emailSchema, telefoneSchema } from './comum';

export const papelUsuarioSchema = z.enum([
  'PROPRIETARIO',
  'ADMIN',
  'CONTADOR',
  'ASSISTENTE',
  'CLIENTE',
]);
export type PapelUsuario = z.infer<typeof papelUsuarioSchema>;

const senhaForte = z
  .string()
  .min(10, 'Senha deve ter ao menos 10 caracteres')
  .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula')
  .regex(/\d/, 'Inclua ao menos um dígito')
  .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um símbolo');

export const criarUsuarioSchema = z
  .object({
    email: emailSchema,
    nome: z.string().min(2).max(120),
    telefone: telefoneSchema.optional(),
    papel: papelUsuarioSchema,
    empresaId: z.string().cuid().optional(),
    senhaTemporaria: senhaForte.optional(),
  })
  .refine(
    (dados) => dados.papel !== 'CLIENTE' || !!dados.empresaId,
    { message: 'CLIENTE exige empresaId vinculada', path: ['empresaId'] },
  );
export type CriarUsuarioEntrada = z.infer<typeof criarUsuarioSchema>;

export const atualizarPapelSchema = z.object({
  papel: papelUsuarioSchema,
  empresaId: z.string().cuid().nullable().optional(),
});
export type AtualizarPapelEntrada = z.infer<typeof atualizarPapelSchema>;
