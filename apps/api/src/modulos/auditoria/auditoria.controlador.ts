import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Papeis } from '../../comum/decoradores/papeis.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import { GuardaPapeis } from '../../comum/guardas/papeis.guarda';

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
    @Query('acao') acao?: string,
    @Query('atorId') atorId?: string,
    @Query('desde') desde?: string,
    @Query('ate') ate?: string,
    @Query('cursor') cursor?: string,
    @Query('limite') limite?: string,
  ) {
    return this.servico.consultar(usuario.escritorioId, {
      entidade,
      entidadeId,
      acao,
      atorId,
      desde: desde ? new Date(desde) : undefined,
      ate: ate ? new Date(ate) : undefined,
      cursor,
      limite: limite ? Number(limite) : undefined,
    });
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Get('acoes')
  acoesDistintas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.acoesDistintas(usuario.escritorioId);
  }
}
