import {
  buscarConversasSchema,
  criarConversaSchema,
  enviarMensagemSchema,
  mudarStatusConversaSchema,
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

import { AtendimentoServico } from './atendimento.servico';

@ApiTags('atendimento')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('atendimento')
export class AtendimentoControlador {
  constructor(private readonly servico: AtendimentoServico) {}

  @Get('conversas')
  listar(@UsuarioAtual() usuario: UsuarioAutenticado, @Query() consulta: unknown) {
    return this.servico.listar(usuario.escritorioId, buscarConversasSchema.parse(consulta));
  }

  @Post('conversas')
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criar(usuario, criarConversaSchema.parse(corpo));
  }

  @Get('conversas/:id')
  obter(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obter(usuario.escritorioId, id);
  }

  @Post('conversas/:id/mensagens')
  enviar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    const dados = enviarMensagemSchema.parse(corpo);
    return this.servico.enviarMensagem(usuario, id, dados.texto);
  }

  @Post('conversas/:id/marcar-lida')
  marcarLida(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.marcarLida(usuario, id);
  }

  @Patch('conversas/:id/status')
  mudarStatus(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    const dados = mudarStatusConversaSchema.parse(corpo);
    return this.servico.mudarStatus(usuario, id, dados.status);
  }
}
