import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

import { AtendimentoServico } from './atendimento.servico';

@ApiTags('atendimento')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('atendimento')
export class AtendimentoControlador {
  constructor(private readonly servico: AtendimentoServico) {}

  @Get('conversas')
  listarConversas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarConversas(usuario.escritorioId);
  }

  @Get('conversas/:id')
  obterConversa(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obterConversa(usuario.escritorioId, id);
  }

  @Post('conversas/:id/mensagens')
  enviarMensagem(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: { texto: string },
  ) {
    return this.servico.enviarMensagem(usuario, id, corpo.texto);
  }
}
