import {
  BadRequestException,
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
import { z } from 'zod';

import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

import { PortalClienteServico } from './portal-cliente.servico';

const abrirConversaSchema = z.object({
  assunto: z.string().max(160).optional(),
  corpo: z.string().min(1).max(8000),
});
const enviarMensagemSchema = z.object({
  corpo: z.string().min(1).max(8000),
});

@ApiTags('portal-cliente')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('portal-cliente')
export class PortalClienteControlador {
  constructor(private readonly servico: PortalClienteServico) {}

  @Get('resumo')
  resumo(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.resumo(this.servico.contexto(usuario));
  }

  @Get('documentos')
  listarDocumentos(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('termo') termo?: string,
  ) {
    return this.servico.listarDocumentos(this.servico.contexto(usuario), termo);
  }

  @Get('documentos/:id/download')
  baixarDocumento(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.urlDownloadDocumento(this.servico.contexto(usuario), id);
  }

  @Get('tarefas')
  listarTarefas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarTarefas(this.servico.contexto(usuario));
  }

  @Get('assinaturas')
  listarAssinaturas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.assinaturasPendentes(this.servico.contexto(usuario));
  }

  @Get('conversas')
  listarConversas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarConversas(this.servico.contexto(usuario));
  }

  @Get('conversas/:id')
  obterConversa(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obterConversa(this.servico.contexto(usuario), id);
  }

  @Post('conversas')
  abrirConversa(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    const parsed = abrirConversaSchema.safeParse(corpo);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.servico.abrirConversa(this.servico.contexto(usuario), parsed.data);
  }

  @Post('conversas/:id/mensagens')
  enviarMensagem(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    const parsed = enviarMensagemSchema.safeParse(corpo);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.servico.enviarMensagem(this.servico.contexto(usuario), id, parsed.data.corpo);
  }

  @Patch('conversas/:id/marcar-lida')
  marcarLida(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.marcarConversaLida(this.servico.contexto(usuario), id);
  }
}
