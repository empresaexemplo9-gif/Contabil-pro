import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import { GuardaPapeis } from '../../comum/guardas/papeis.guarda';
import { Papeis } from '../../comum/decoradores/papeis.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { AuditoriaServico } from './auditoria.servico';

@ApiTags('auditoria')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('auditoria')
export class AuditoriaControlador {
  constructor(private readonly servico: AuditoriaServico) {}

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Get()
  listar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('entidade') entidade?: string,
    @Query('entidadeId') entidadeId?: string,
  ) {
    return this.servico.consultar(usuario.escritorioId, { entidade, entidadeId });
  }
}
