import {
  atualizarTarefaSchema,
  buscarTarefasSchema,
  criarTarefaSchema,
} from '@contabilpro/contracts';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
    return this.servico.listar(usuario.escritorioId, buscarTarefasSchema.parse(consulta));
  }

  @Get('metricas')
  metricas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.metricas(usuario.escritorioId);
  }

  @Get(':id')
  obter(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obter(usuario.escritorioId, id);
  }

  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criar(usuario, criarTarefaSchema.parse(corpo));
  }

  @Patch(':id')
  atualizar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.atualizar(usuario, id, atualizarTarefaSchema.parse(corpo));
  }
}
