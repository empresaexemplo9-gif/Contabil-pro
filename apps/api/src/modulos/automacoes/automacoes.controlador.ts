import {
  atualizarAutomacaoSchema,
  criarAutomacaoSchema,
} from '@contabilpro/contracts';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @Get(':id')
  obter(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obter(usuario.escritorioId, id);
  }

  @Get(':id/execucoes')
  execucoes(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.listarExecucoes(usuario.escritorioId, id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criar(usuario, criarAutomacaoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Patch(':id')
  atualizar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.atualizar(usuario, id, atualizarAutomacaoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Post(':id/ativar')
  ativar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.mudarStatus(usuario, id, true);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Post(':id/pausar')
  pausar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.mudarStatus(usuario, id, false);
  }
}
