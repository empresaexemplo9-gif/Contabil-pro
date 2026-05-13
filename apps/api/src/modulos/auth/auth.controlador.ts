import {
  ativarMfaSchema,
  desativarMfaSchema,
  loginEntradaSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
  refreshEntradaSchema,
} from '@contabilpro/contracts';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


import { Publico } from '../../comum/decoradores/publico.decorador';
import {
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../comum/decoradores/usuario-atual.decorador';
import { GuardaJwt } from '../../comum/guardas/jwt.guarda';
import { configurarEnv } from '../../config/env';

import { AuthServico } from './auth.servico';
import { GoogleOauthServico } from './google-oauth.servico';

import type { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthControlador {
  constructor(
    private readonly servico: AuthServico,
    private readonly google: GoogleOauthServico,
  ) {}

  @Publico()
  @Get('google/disponivel')
  googleDisponivel() {
    return { disponivel: this.google.estaConfigurado() };
  }

  @Publico()
  @Get('google/iniciar')
  googleIniciar(@Query('audiencia') audiencia?: string) {
    const aud =
      audiencia === 'portal-cliente' ? 'portal-cliente' : 'escritorio';
    const url = this.google.gerarUrlAutorizacao(aud);
    return { url };
  }

  @Publico()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') erro: string | undefined,
    @Ip() ip: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const env = configurarEnv();
    if (erro) {
      return res.redirect(this.urlPosLogin(env.WEB_URL, 'escritorio', { erro }));
    }
    if (!code || !state) {
      throw new BadRequestException('parâmetros code/state ausentes');
    }
    const { usuario, vinculo, audiencia } = await this.google.trocarCodeEAutenticar(
      code,
      state,
    );
    const sessao = await this.servico.emitirSessao(usuario.id, vinculo, {
      ip,
      userAgent: req.headers['user-agent'] ?? undefined,
    });
    return res.redirect(
      this.urlPosLogin(env.WEB_URL, audiencia, {
        token: sessao.tokenAcesso,
        refresh: sessao.tokenRefresh,
      }),
    );
  }

  private urlPosLogin(
    base: string,
    audiencia: 'escritorio' | 'portal-cliente',
    params: Record<string, string | undefined>,
  ): string {
    const caminho =
      audiencia === 'portal-cliente'
        ? '/portal-cliente/login/google'
        : '/login/google';
    const url = new URL(caminho, base);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
    return url.toString();
  }

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
