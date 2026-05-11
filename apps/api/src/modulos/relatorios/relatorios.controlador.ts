import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

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

  @Get('tarefas-por-status')
  tarefasPorStatus(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.tarefasPorStatus(usuario.escritorioId);
  }

  @Get('empresas-por-regime')
  empresasPorRegime(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.empresasPorRegime(usuario.escritorioId);
  }

  @Get('conversas-por-canal')
  conversasPorCanal(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.conversasPorCanal(usuario.escritorioId);
  }

  @Get('atividade')
  atividade(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('dias') dias?: string,
  ) {
    const n = Math.min(Math.max(Number(dias ?? 30), 7), 180);
    return this.servico.atividade(usuario.escritorioId, n);
  }
}
