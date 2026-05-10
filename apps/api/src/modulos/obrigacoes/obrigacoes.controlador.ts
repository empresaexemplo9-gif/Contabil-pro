import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
  listarModelos(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.listarModelos(usuario.escritorioId);
  }

  @Papeis('PROPRIETARIO', 'ADMIN', 'CONTADOR')
  @Post('modelos')
  criarModelo(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() corpo: { nome: string; frequencia: string; diaVencimento?: number },
  ) {
    return this.servico.criarModelo(usuario.escritorioId, corpo);
  }
}
