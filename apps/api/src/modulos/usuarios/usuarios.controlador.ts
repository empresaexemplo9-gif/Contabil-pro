import { atualizarPapelSchema, criarUsuarioSchema } from '@contabilpro/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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

import { UsuariosServico } from './usuarios.servico';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('usuarios')
export class UsuariosControlador {
  constructor(private readonly servico: UsuariosServico) {}

  @Get('eu')
  obterPerfil(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.obterPerfil(usuario.id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarDoEscritorio(usuario.escritorioId);
  }

  /**
   * Cria um novo usuário e vincula ao escritório.
   *
   * Restrito a PROPRIETARIO/ADMIN — não há cadastro público no produto.
   */
  @Papeis('PROPRIETARIO', 'ADMIN')
  @Post()
  criar(@UsuarioAtual() ator: UsuarioAutenticado, @Body() corpo: unknown) {
    const dados = criarUsuarioSchema.parse(corpo);
    return this.servico.criar(ator, dados);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Patch(':id/papel')
  atualizarPapel(
    @UsuarioAtual() ator: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    const dados = atualizarPapelSchema.parse(corpo);
    return this.servico.atualizarPapel(ator, id, dados);
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Delete(':id')
  @HttpCode(204)
  async desativar(@UsuarioAtual() ator: UsuarioAutenticado, @Param('id') id: string) {
    await this.servico.desativar(ator, id);
  }
}
