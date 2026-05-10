import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Papeis } from '../../comum/decoradores/papeis.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import { GuardaPapeis } from '../../comum/guardas/papeis.guarda';

import { AutomacoesServico } from './automacoes.servico';

@ApiTags('automacoes')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('automacoes')
export class AutomacoesControlador {
  constructor(private readonly servico: AutomacoesServico) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listar(usuario.escritorioId);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Post()
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() corpo: { nome: string; gatilho: unknown; passos: unknown },
  ) {
    return this.servico.criar(usuario.escritorioId, corpo);
  }
}
