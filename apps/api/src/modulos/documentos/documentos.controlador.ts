import {
  atualizarCategoriaDocumentoSchema,
  buscarDocumentosSchema,
  criarCategoriaDocumentoSchema,
  criarDocumentoSchema,
  criarVersaoDocumentoSchema,
  presignarUploadSchema,
} from '@contabilpro/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

import { ArmazenamentoServico } from './armazenamento.servico';
import { DocumentosServico } from './documentos.servico';

@ApiTags('documentos')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('documentos')
export class DocumentosControlador {
  constructor(
    private readonly servico: DocumentosServico,
    private readonly armazenamento: ArmazenamentoServico,
  ) {}

  // --- Categorias ---

  @Get('categorias')
  listarCategorias(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarCategorias(usuario.escritorioId);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Post('categorias')
  criarCategoria(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criarCategoria(usuario, criarCategoriaDocumentoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Patch('categorias/:id')
  atualizarCategoria(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.atualizarCategoria(
      usuario,
      id,
      atualizarCategoriaDocumentoSchema.parse(corpo),
    );
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Delete('categorias/:id')
  removerCategoria(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.removerCategoria(usuario, id);
  }

  // --- Documentos ---

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado, @Query() consulta: unknown) {
    return this.servico.listar(usuario.escritorioId, buscarDocumentosSchema.parse(consulta));
  }

  @Post('presignar-upload')
  presignar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    const dados = presignarUploadSchema.parse(corpo);
    return this.armazenamento.gerarUrlUpload(usuario.escritorioId, dados);
  }

  @Get(':id')
  obter(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obter(usuario.escritorioId, id);
  }

  @Get(':id/download')
  download(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.urlDownload(usuario.escritorioId, id);
  }

  @Get(':id/versoes/:versaoId/download')
  downloadVersao(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Param('versaoId') versaoId: string,
  ) {
    return this.servico.urlDownloadVersao(usuario.escritorioId, id, versaoId);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR', 'ASSISTENTE')
  @Post()
  registrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.registrar(usuario, criarDocumentoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR', 'ASSISTENTE')
  @Post(':id/versoes')
  criarVersao(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.criarVersao(usuario, id, criarVersaoDocumentoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Delete(':id')
  arquivar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.arquivar(usuario, id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Post(':id/restaurar')
  restaurar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.restaurar(usuario, id);
  }
}
