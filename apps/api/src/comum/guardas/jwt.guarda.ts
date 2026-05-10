import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { verificarTokenAcesso } from '@contabilpro/auth-core';

import { configurarEnv } from '../../config/env';
import { CHAVE_PUBLICO } from '../decoradores/publico.decorador';

@Injectable()
export class GuardaJwt implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const ehPublico = this.reflector.getAllAndOverride<boolean>(CHAVE_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (ehPublico) return true;

    const requisicao = contexto.switchToHttp().getRequest();
    const cabecalho = requisicao.headers.authorization;
    if (!cabecalho?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente');
    }
    const token = cabecalho.slice(7);
    try {
      const env = configurarEnv();
      const payload = await verificarTokenAcesso(token, env.JWT_PUBLIC_KEY);
      requisicao.usuario = {
        id: payload.sub,
        escritorioId: payload.escritorioId,
        papel: payload.papel,
        permissoes: payload.permissoes ?? [],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
