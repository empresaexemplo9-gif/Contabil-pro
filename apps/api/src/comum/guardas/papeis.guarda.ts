import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CHAVE_PAPEIS } from '../decoradores/papeis.decorador';

@Injectable()
export class GuardaPapeis implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const papeisExigidos = this.reflector.getAllAndOverride<string[] | undefined>(CHAVE_PAPEIS, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!papeisExigidos || papeisExigidos.length === 0) return true;

    const usuario = contexto.switchToHttp().getRequest().usuario as
      | { papel: string }
      | undefined;
    if (!usuario || !papeisExigidos.includes(usuario.papel)) {
      throw new ForbiddenException('Permissão insuficiente');
    }
    return true;
  }
}
