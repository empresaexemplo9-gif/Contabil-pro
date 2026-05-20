import {
  atualizarCategoriaDocumentoSchema,
  buscarDocumentosSchema,
  criarCategoriaDocumentoSchema,
  criarDocumentoSchema,
  criarVersaoDocumentoSchema,
} from '@contabilpro/contracts';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  /**
   * Upload de arquivo direto via multipart. Substitui o antigo
   * `presignar-upload` (S3): no Vercel Blob não há presigned PUT,
   * então o arquivo passa pela função e é enviado server-side.
   * Limite: 4.5 MB por padrão no Vercel (pode aumentar no Pro).
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('arquivo'))
  async upload(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @UploadedFile() arquivo: Express.Multer.File | undefined,
  ): Promise<{ url: string; chave: string }> {
    if (!arquivo) throw new BadRequestException('Arquivo obrigatório no campo "arquivo"');
    return this.armazenamento.upload(usuario.escritorioId, {
      buffer: arquivo.buffer,
      mimetype: arquivo.mimetype,
      originalname: arquivo.originalname,
    });
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
