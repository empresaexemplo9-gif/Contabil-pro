import {
  ativarMfaSchema,
  desativarMfaSchema,
  loginEntradaSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
  refreshEntradaSchema,
} from '@contabilpro/contracts';
import { Body, Controller, HttpCode, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


import { Publico } from '../../comum/decoradores/publico.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';

import { AuthServico } from './auth.servico';

import type { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthControlador {
  constructor(private readonly servico: AuthServico) {}

  @Publico()
  @Post('login')
  async login(@Body() corpo: unknown, @Ip() ip: string, @Req() req: Request) {
    const dados = loginEntradaSchema.parse(corpo);
    return this.servico.login(dados, {
      ip,
      userAgent: req.headers['user-agent'] ?? undefined,
    });
  }

  @Publico()
  @Post('refresh')
  async refresh(@Body() corpo: unknown, @Ip() ip: string, @Req() req: Request) {
    const dados = refreshEntradaSchema.parse(corpo);
    return this.servico.renovar(dados, {
      ip,
      userAgent: req.headers['user-agent'] ?? undefined,
    });
  }

  @Publico()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body('tokenRefresh') tokenRefresh: string) {
    await this.servico.logout(tokenRefresh);
  }

  @ApiBearerAuth()
  @UseGuards(GuardaJwt)
  @Post('logout-todas')
  @HttpCode(204)
  async logoutTodas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    await this.servico.logoutTodas(usuario.id);
  }

  @Publico()
  @Post('recuperar-senha')
  @HttpCode(202)
  async recuperar(@Body() corpo: unknown, @Ip() ip: string) {
    const dados = recuperarSenhaSchema.parse(corpo);
    await this.servico.solicitarRecuperacao(dados, { ip });
    return { ok: true };
  }

  @Publico()
  @Post('redefinir-senha')
  @HttpCode(204)
  async redefinir(@Body() corpo: unknown) {
    const dados = redefinirSenhaSchema.parse(corpo);
    await this.servico.redefinirSenha(dados);
  }

  @ApiBearerAuth()
  @UseGuards(GuardaJwt)
  @Post('mfa/iniciar')
  async iniciarMfa(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.servico.iniciarMfa(usuario.id);
  }

  @ApiBearerAuth()
  @UseGuards(GuardaJwt)
  @Post('mfa/ativar')
  @HttpCode(204)
  async ativarMfa(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    await this.servico.ativarMfa(usuario.id, ativarMfaSchema.parse(corpo));
  }

  @ApiBearerAuth()
  @UseGuards(GuardaJwt)
  @Post('mfa/desativar')
  @HttpCode(204)
  async desativarMfa(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() corpo: unknown) {
    await this.servico.desativarMfa(usuario.id, desativarMfaSchema.parse(corpo));
  }
}
