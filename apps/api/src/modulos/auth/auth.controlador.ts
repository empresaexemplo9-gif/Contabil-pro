import { loginEntradaSchema, refreshEntradaSchema } from '@contabilpro/contracts';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';


import { Publico } from '../../comum/decoradores/publico.decorador';

import { AuthServico } from './auth.servico';

@ApiTags('auth')
@Controller('auth')
export class AuthControlador {
  constructor(private readonly servico: AuthServico) {}

  @Publico()
  @Post('login')
  async login(@Body() corpo: unknown) {
    const dados = loginEntradaSchema.parse(corpo);
    return this.servico.login(dados);
  }

  @Publico()
  @Post('refresh')
  async refresh(@Body() corpo: unknown) {
    const dados = refreshEntradaSchema.parse(corpo);
    return this.servico.renovar(dados);
  }

  @Post('logout')
  async logout(@Body('tokenRefresh') tokenRefresh: string) {
    await this.servico.logout(tokenRefresh);
    return { ok: true };
  }
}
