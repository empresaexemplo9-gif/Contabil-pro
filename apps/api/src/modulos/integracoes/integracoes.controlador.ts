import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Papeis } from '../../comum/decoradores/papeis.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import { GuardaPapeis } from '../../comum/guardas/papeis.guarda';

import { IntegracoesServico } from './integracoes.servico';

@ApiTags('integracoes')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('integracoes')
export class IntegracoesControlador {
  constructor(private readonly servico: IntegracoesServico) {}

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listar(usuario.escritorioId);
  }
}
