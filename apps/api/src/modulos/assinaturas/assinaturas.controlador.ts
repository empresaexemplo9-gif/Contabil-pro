import { criarSolicitacaoAssinaturaSchema } from '@contabilpro/contracts';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

import { AssinaturasServico } from './assinaturas.servico';

@ApiTags('assinaturas')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('assinaturas')
export class AssinaturasControlador {
  constructor(private readonly servico: AssinaturasServico) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listar(usuario.escritorioId);
  }

  @Get(':id')
  obter(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obter(usuario.escritorioId, id);
  }

  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criar(usuario.escritorioId, criarSolicitacaoAssinaturaSchema.parse(corpo));
  }

  @Post(':id/cancelar')
  cancelar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.cancelar(usuario.escritorioId, id);
  }
}
