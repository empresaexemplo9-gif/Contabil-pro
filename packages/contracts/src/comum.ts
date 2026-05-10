import { z } from 'zod';

export const idSchema = z.string().cuid();

export const paginacaoSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().max(100).default(20),
  ordenarPor: z.string().optional(),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});
export type Paginacao = z.infer<typeof paginacaoSchema>;

export const respostaPaginadaSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    itens: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    pagina: z.number().int().positive(),
    tamanho: z.number().int().positive(),
  });

export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido');

export const cpfSchema = z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido');

export const emailSchema = z.string().email('E-mail inválido').max(255);

export const telefoneSchema = z
  .string()
  .regex(/^\+?\d{10,15}$/, 'Telefone deve conter apenas dígitos com DDD');
