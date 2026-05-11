import {
  atualizarEmpresaSchema,
  buscarEmpresasSchema,
  criarContatoEmpresaSchema,
  criarEmpresaSchema,
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

import { EmpresasServico } from './empresas.servico';

@ApiTags('empresas')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('empresas')
export class EmpresasControlador {
  constructor(private readonly servico: EmpresasServico) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado, @Query() consulta: unknown) {
    return this.servico.listar(usuario.escritorioId, buscarEmpresasSchema.parse(consulta));
  }

  @Get(':id')
  obter(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obter(usuario.escritorioId, id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criar(
      usuario.escritorioId,
      usuario.id,
      criarEmpresaSchema.parse(corpo),
    );
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Patch(':id')
  atualizar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.atualizar(
      usuario.escritorioId,
      usuario.id,
      id,
      atualizarEmpresaSchema.parse(corpo),
    );
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Delete(':id')
  remover(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.remover(usuario.escritorioId, usuario.id, id);
  }

  @Get(':id/contatos')
  listarContatos(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.listarContatos(usuario.escritorioId, id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR', 'ASSISTENTE')
  @Post(':id/contatos')
  criarContato(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.criarContato(
      usuario.escritorioId,
      usuario.id,
      id,
      criarContatoEmpresaSchema.parse(corpo),
    );
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR', 'ASSISTENTE')
  @Delete(':id/contatos/:contatoId')
  removerContato(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Param('contatoId') contatoId: string,
  ) {
    return this.servico.removerContato(usuario.escritorioId, usuario.id, id, contatoId);
  }
}
