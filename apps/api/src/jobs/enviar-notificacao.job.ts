import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';
import { z } from 'zod';

import type { Prisma } from '@contabilpro/database';

export const PayloadNotificacao = z.object({
  escritorioId: z.string().uuid(),
  usuarioId: z.string().uuid(),
  tipo: z.string(),
  canal: z.string(),
  titulo: z.string(),
  corpo: z.string(),
  dados: z.record(z.unknown()).optional(),
});
export type PayloadNotificacao = z.infer<typeof PayloadNotificacao>;

export async function processarNotificacao(payloadBruto: unknown): Promise<void> {
  const payload = PayloadNotificacao.parse(payloadBruto);
  await prisma.notificacao.create({
    data: {
      escritorioId: payload.escritorioId,
      usuarioId: payload.usuarioId,
      tipo: payload.tipo as never,
      canal: payload.canal as never,
      titulo: payload.titulo,
      corpo: payload.corpo,
      payload: (payload.dados ?? {}) as Prisma.InputJsonValue,
      enviadaEm: new Date(),
    },
  });
  logger.debug({ usuarioId: payload.usuarioId }, 'notificação persistida');
}
