import { atualizarTarefaSchema, criarTarefaSchema, paginacaoSchema } from '@contabilpro/contracts';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

import { TarefasServico } from './tarefas.servico';

@ApiTags('tarefas')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('tarefas')
export class TarefasControlador {
  constructor(private readonly servico: TarefasServico) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado, @Query() consulta: unknown) {
    return this.servico.listar(usuario.escritorioId, paginacaoSchema.parse(consulta));
  }

  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criar(usuario.escritorioId, criarTarefaSchema.parse(corpo));
  }

  @Patch(':id')
  atualizar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.atualizar(usuario.escritorioId, id, atualizarTarefaSchema.parse(corpo));
  }
}
