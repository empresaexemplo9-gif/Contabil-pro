import { AsyncLocalStorage } from 'node:async_hooks';

import type { Prisma } from '@contabilpro/database';

interface ContextoTenant {
  escritorioId: string;
  tx: Prisma.TransactionClient;
}

const armazenamento = new AsyncLocalStorage<ContextoTenant>();

export const TenantContexto = {
  executar<T>(escritorioId: string, tx: Prisma.TransactionClient, fn: () => T): T {
    return armazenamento.run({ escritorioId, tx }, fn);
  },

  atual(): ContextoTenant | undefined {
    return armazenamento.getStore();
  },

  escritorioAtual(): string | undefined {
    return armazenamento.getStore()?.escritorioId;
  },

  txAtual(): Prisma.TransactionClient | undefined {
    return armazenamento.getStore()?.tx;
  },
};
