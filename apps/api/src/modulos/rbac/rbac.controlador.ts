import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

import { RbacServico } from './rbac.servico';

@ApiTags('rbac')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('rbac')
export class RbacControlador {
  constructor(private readonly servico: RbacServico) {}

  @Get('papeis')
  listarPapeis() {
    return this.servico.listarPapeis();
  }

  @Get('permissoes')
  listarPermissoes() {
    return this.servico.listarPermissoes();
  }
}
