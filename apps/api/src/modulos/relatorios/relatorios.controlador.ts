import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { RelatoriosServico } from './relatorios.servico';

@ApiTags('relatorios')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('relatorios')
export class RelatoriosControlador {
  constructor(private readonly servico: RelatoriosServico) {}

  @Get('dashboard')
  dashboard(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.dashboard(usuario.escritorioId);
  }
}
