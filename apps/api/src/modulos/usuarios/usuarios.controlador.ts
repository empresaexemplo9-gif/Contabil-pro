import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Papeis } from '../../comum/decoradores/papeis.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import { GuardaPapeis } from '../../comum/guardas/papeis.guarda';

import { UsuariosServico } from './usuarios.servico';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('usuarios')
export class UsuariosControlador {
  constructor(private readonly servico: UsuariosServico) {}

  @Get('eu')
  obterPerfil(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.obterPerfil(usuario.id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarDoEscritorio(usuario.escritorioId);
  }
}
