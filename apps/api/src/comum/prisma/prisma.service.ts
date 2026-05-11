import { PrismaClient } from '@contabilpro/database';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';


import { TenantContexto } from '../tenant/tenant.context';

/**
 * PrismaService estende o client com delegação automática para a transação
 * do contexto de tenant, quando presente. Isso permite que o middleware/
 * interceptor abra uma transação por requisição com `SET LOCAL
 * app.escritorio_id = ...`, e o restante do código continue usando
 * `this.prisma.modelo.metodo()` normalmente — as queries serão executadas
 * dentro da transação e respeitarão as políticas de RLS.
 *
 * Fora de uma requisição autenticada (workers, seeds, jobs cross-tenant),
 * as queries usam o client base, sem RLS aplicado.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    return this.aplicarDelegacao();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private aplicarDelegacao(): PrismaService {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query, operation, model }) {
            const tx = TenantContexto.txAtual();
            if (!tx) return query(args);
            const cliente = tx as unknown as Record<
              string,
              Record<string, (a: unknown) => Promise<unknown>>
            >;
            const delegado = cliente[model];
            const operacao = delegado?.[operation];
            if (!delegado || !operacao) return query(args);
            return operacao.call(delegado, args);
          },
        },
      },
    }) as unknown as PrismaService;
  }
}
