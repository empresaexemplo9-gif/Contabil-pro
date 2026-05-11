import { criarIntegracaoSchema } from '@contabilpro/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criar(usuario, criarIntegracaoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Post(':id/desativar')
  desativar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.desativar(usuario, id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Delete(':id')
  remover(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.remover(usuario, id);
  }
}
