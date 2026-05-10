import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaInstancia: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.prismaInstancia ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaInstancia = prisma;
}
