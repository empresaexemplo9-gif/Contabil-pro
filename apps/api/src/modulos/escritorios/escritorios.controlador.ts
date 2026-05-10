import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { EscritoriosServico } from './escritorios.servico';

@ApiTags('escritorios')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('escritorios')
export class EscritoriosControlador {
  constructor(private readonly servico: EscritoriosServico) {}

  @Get('atual')
  obterAtual(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.obter(usuario.escritorioId);
  }
}
