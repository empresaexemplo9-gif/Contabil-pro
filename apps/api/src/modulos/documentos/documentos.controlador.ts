import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { criarDocumentoSchema, paginacaoSchema, presignarUploadSchema } from '@contabilpro/contracts';

import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { DocumentosServico } from './documentos.servico';
import { ArmazenamentoServico } from './armazenamento.servico';

@ApiTags('documentos')
@ApiBearerAuth()
@UseGuards(GuardaJwt)
@Controller('documentos')
export class DocumentosControlador {
  constructor(
    private readonly servico: DocumentosServico,
    private readonly armazenamento: ArmazenamentoServico,
  ) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado, @Query() consulta: unknown) {
    return this.servico.listar(usuario.escritorioId, paginacaoSchema.parse(consulta));
  }

  @Get(':id')
  obter(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obter(usuario.escritorioId, id);
  }

  @Post('presignar-upload')
  presignar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    const dados = presignarUploadSchema.parse(corpo);
    return this.armazenamento.gerarUrlUpload(usuario.escritorioId, dados);
  }

  @Post()
  registrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.registrar(usuario, criarDocumentoSchema.parse(corpo));
  }
}
