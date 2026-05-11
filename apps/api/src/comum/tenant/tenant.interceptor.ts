import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, firstValueFrom, from } from 'rxjs';

import { PrismaService } from '../prisma/prisma.service';

import { TenantContexto } from './tenant.context';

import type { UsuarioAutenticado } from '../decoradores/usuario-atual.decorador';

/**
 * Para cada requisição com usuário autenticado, abre uma transação interativa
 * e define `app.escritorio_id` via `SET LOCAL` antes de executar o handler.
 * Todas as queries do Prisma feitas dentro do handler são delegadas para essa
 * transação (via PrismaService) e respeitam as políticas RLS do banco.
 *
 * Requisições públicas ou de webhooks rodam fora do contexto: a query usa o
 * client base, sem GUC setada — as políticas RLS bloqueiam acesso a dados
 * tenant-scoped (comportamento desejado: zero linhas).
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(contexto: ExecutionContext, proximo: CallHandler): Observable<unknown> {
    const requisicao = contexto
      .switchToHttp()
      .getRequest<{ usuario?: UsuarioAutenticado }>();
    const escritorioId = requisicao.usuario?.escritorioId;
    if (!escritorioId) {
      return proximo.handle();
    }

    const promessa = this.prisma.$transaction(
      async (tx) => {
        // current_setting aceita apenas string; quotamos por segurança.
        const seguro = escritorioId.replace(/'/g, "''");
        await tx.$executeRawUnsafe(`SET LOCAL app.escritorio_id = '${seguro}'`);
        return TenantContexto.executar(escritorioId, tx, () =>
          firstValueFrom(proximo.handle()),
        );
      },
      { maxWait: 5_000, timeout: 30_000 },
    );

    return from(promessa);
  }
}
