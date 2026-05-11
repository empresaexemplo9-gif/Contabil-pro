import {
  atualizarModeloObrigacaoSchema,
  criarModeloObrigacaoSchema,
  gerarTarefasSchema,
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

import { ObrigacoesServico } from './obrigacoes.servico';

@ApiTags('obrigacoes')
@ApiBearerAuth()
@UseGuards(GuardaJwt, GuardaPapeis)
@Controller('obrigacoes')
export class ObrigacoesControlador {
  constructor(private readonly servico: ObrigacoesServico) {}

  @Get('modelos')
  listarModelos(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('incluirInativos') incluirInativos?: string,
  ) {
    return this.servico.listarModelos(usuario.escritorioId, incluirInativos === 'true');
  }

  @Get('modelos/:id')
  obterModelo(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.obterModelo(usuario.escritorioId, id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Post('modelos')
  criarModelo(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    return this.servico.criarModelo(usuario, criarModeloObrigacaoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Patch('modelos/:id')
  atualizarModelo(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.atualizarModelo(usuario, id, atualizarModeloObrigacaoSchema.parse(corpo));
  }

  @Papeis('PROPRIETARIO', 'ADMIN')
  @Delete('modelos/:id')
  desativarModelo(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.servico.desativarModelo(usuario, id);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Post('modelos/:id/gerar-tarefas')
  gerar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    return this.servico.gerarTarefas(usuario, id, gerarTarefasSchema.parse(corpo));
  }
}
