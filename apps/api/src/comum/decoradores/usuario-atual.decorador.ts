import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface UsuarioAutenticado {
  id: string;
  escritorioId: string;
  papel: string;
  permissoes: string[];
}

export const UsuarioAtual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const requisicao = ctx.switchToHttp().getRequest();
    return requisicao.usuario as UsuarioAutenticado;
  },
);
