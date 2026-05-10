import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { emitirTokenAcesso, validarCodigoMfa, verificarSenha } from '@contabilpro/auth-core';
import type { LoginEntrada, LoginSaida, RefreshEntrada } from '@contabilpro/contracts';

import { configurarEnv } from '../../config/env';
import { PrismaService } from '../../comum/prisma/prisma.service';

@Injectable()
export class AuthServico {
  constructor(private readonly prisma: PrismaService) {}

  async login(dados: LoginEntrada): Promise<LoginSaida> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dados.email },
      include: { vinculos: { take: 1 } },
    });
    if (!usuario || !usuario.senhaHash || usuario.status !== 'ATIVO') {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const senhaOk = await verificarSenha(usuario.senhaHash, dados.senha);
    if (!senhaOk) throw new UnauthorizedException('Credenciais inválidas');

    if (usuario.mfaAtivo && usuario.mfaSegredo) {
      if (!dados.codigoMfa) {
        return { tokenAcesso: '', tokenRefresh: '', expiraEm: 0, exigeMfa: true };
      }
      const ok = validarCodigoMfa(dados.codigoMfa, usuario.mfaSegredo);
      if (!ok) throw new UnauthorizedException('Código MFA inválido');
    }

    const vinculo = usuario.vinculos[0];
    if (!vinculo) throw new UnauthorizedException('Usuário sem vínculo a escritório');

    const env = configurarEnv();
    const ttlSegundos = 60 * 15;
    const tokenAcesso = await emitirTokenAcesso(
      {
        sub: usuario.id,
        escritorioId: vinculo.escritorioId,
        papel: vinculo.papel,
        permissoes: vinculo.permissoes,
      },
      env.JWT_PRIVATE_KEY,
      ttlSegundos,
    );

    const refreshBruto = randomBytes(48).toString('base64url');
    const refreshHash = createHash('sha256').update(refreshBruto).digest('hex');
    const expiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.sessao.create({
      data: {
        usuarioId: usuario.id,
        refreshTokenHash: refreshHash,
        expiraEm,
      },
    });

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLoginEm: new Date() },
    });

    return {
      tokenAcesso,
      tokenRefresh: refreshBruto,
      expiraEm: ttlSegundos,
      exigeMfa: false,
    };
  }

  async renovar(_dados: RefreshEntrada): Promise<LoginSaida> {
    // TODO: implementar rotação com reuse-detection (revoga toda a cadeia em caso de reuso).
    throw new UnauthorizedException('Não implementado');
  }

  async logout(tokenRefresh: string): Promise<void> {
    if (!tokenRefresh) return;
    const hash = createHash('sha256').update(tokenRefresh).digest('hex');
    await this.prisma.sessao.updateMany({
      where: { refreshTokenHash: hash, revogadaEm: null },
      data: { revogadaEm: new Date() },
    });
  }
}
