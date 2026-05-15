import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';
import { configurarEnv } from '../../config/env';

interface PerfilGoogle {
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  sub: string;
}

const ENDPOINT_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const ENDPOINT_TOKEN = 'https://oauth2.googleapis.com/token';
const ENDPOINT_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';
const ESCOPOS = ['openid', 'email', 'profile'];

/**
 * OAuth 2.0 com Google Identity. Fluxo "Authorization Code" sem PKCE
 * (cliente confidencial: backend troca o code por token).
 *
 * Estado é assinado com hash SHA-256 + segredo do JWT para evitar CSRF
 * sem precisar persistir nada — bastam parâmetros opcionais (audiência:
 * escritorio ou portal-cliente, redirect pos-login).
 */
@Injectable()
export class GoogleOauthServico {
  private readonly logger = new Logger(GoogleOauthServico.name);

  constructor(private readonly prisma: PrismaService) {}

  estaConfigurado(): boolean {
    const env = configurarEnv();
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI);
  }

  gerarUrlAutorizacao(audiencia: 'escritorio' | 'portal-cliente'): string {
    const env = configurarEnv();
    if (!this.estaConfigurado()) {
      throw new ServiceUnavailableException('Login com Google não configurado');
    }
    const nonce = randomBytes(16).toString('base64url');
    const state = `${audiencia}.${nonce}.${this.assinarEstado(audiencia, nonce)}`;
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: ESCOPOS.join(' '),
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'select_account',
      state,
    });
    return `${ENDPOINT_AUTH}?${params.toString()}`;
  }

  async trocarCodeEAutenticar(code: string, state: string) {
    const env = configurarEnv();
    if (!this.estaConfigurado()) {
      throw new ServiceUnavailableException('Login com Google não configurado');
    }

    const audiencia = this.validarEstado(state);

    const respToken = await fetch(ENDPOINT_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });
    if (!respToken.ok) {
      const corpo = await respToken.text().catch(() => '');
      this.logger.warn(`falha troca code Google: ${respToken.status} ${corpo}`);
      throw new UnauthorizedException('Não foi possível autenticar com Google');
    }
    const tokens = (await respToken.json()) as { access_token?: string };
    if (!tokens.access_token) {
      throw new UnauthorizedException('Resposta Google inválida');
    }

    const respPerfil = await fetch(ENDPOINT_USERINFO, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!respPerfil.ok) {
      throw new UnauthorizedException('Não foi possível ler perfil Google');
    }
    const perfil = (await respPerfil.json()) as PerfilGoogle;
    if (!perfil.email || !perfil.email_verified) {
      throw new UnauthorizedException('E-mail Google não verificado');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: perfil.email.toLowerCase() },
      include: { vinculos: { take: 1 } },
    });

    if (!usuario || usuario.status !== 'ATIVO' || usuario.vinculos.length === 0) {
      throw new UnauthorizedException(
        'Conta Google não vinculada a nenhum escritório. Solicite convite.',
      );
    }

    if (usuario.mfaAtivo) {
      throw new UnauthorizedException(
        'Sua conta exige MFA — entre por usuário e senha para continuar.',
      );
    }

    if (!usuario.emailVerificado) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { emailVerificado: true },
      });
    }

    return { usuario, vinculo: usuario.vinculos[0]!, audiencia };
  }

  private assinarEstado(audiencia: string, nonce: string): string {
    const env = configurarEnv();
    return createHash('sha256')
      .update(`${audiencia}|${nonce}|${env.JWT_PRIVATE_KEY.slice(0, 64)}`)
      .digest('base64url');
  }

  private validarEstado(state: string): 'escritorio' | 'portal-cliente' {
    const partes = state.split('.');
    if (partes.length !== 3) throw new BadRequestException('state inválido');
    const [audiencia, nonce, assinatura] = partes;
    if (audiencia !== 'escritorio' && audiencia !== 'portal-cliente') {
      throw new BadRequestException('audiência inválida');
    }
    const esperada = this.assinarEstado(audiencia, nonce!);
    if (esperada !== assinatura) {
      throw new BadRequestException('state assinatura inválida');
    }
    return audiencia;
  }
}
