import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

import { NotificacoesServico } from './notificacoes.servico';

@ApiTags('notificacoes')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('notificacoes')
export class NotificacoesControlador {
  constructor(private readonly servico: NotificacoesServico) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarParaUsuario(usuario.id);
  }

  @Patch(':id/lida')
  marcarLida(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.marcarLida(usuario.id, id);
  }
}
