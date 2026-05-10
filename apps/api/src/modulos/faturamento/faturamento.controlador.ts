import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Papeis } from '../../comum/decoradores/papeis.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import { GuardaPapeis } from '../../comum/guardas/papeis.guarda';

import { FaturamentoServico } from './faturamento.servico';

@ApiTags('faturamento')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('faturamento')
export class FaturamentoControlador {
  constructor(private readonly servico: FaturamentoServico) {}

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Get('plano')
  obterPlano(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.obterPlano(usuario.escritorioId);
  }
}
