import { createHash, randomBytes, randomUUID } from 'node:crypto';

import {
  emitirTokenAcesso,
  gerarHashSenha,
  gerarSegredoMfa,
  gerarUriMfa,
  validarCodigoMfa,
  verificarSenha,
} from '@contabilpro/auth-core';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';



import { PrismaService } from '../../comum/prisma/prisma.service';
import { configurarEnv } from '../../config/env';

import type {
  AtivarMfaEntrada,
  DesativarMfaEntrada,
  IniciarMfaSaida,
  LoginEntrada,
  LoginSaida,
  RecuperarSenhaEntrada,
  RedefinirSenhaEntrada,
  RefreshEntrada,
} from '@contabilpro/contracts';
import type { Queue } from 'bullmq';

const TTL_ACESSO_SEGUNDOS = 60 * 15;
const TTL_REFRESH_MS = 30 * 24 * 60 * 60 * 1000;
const TTL_RECUPERACAO_MS = 60 * 60 * 1000;

function hashTexto(valor: string): string {
  return createHash('sha256').update(valor).digest('hex');
}

@Injectable()
export class AuthServico {
  private readonly logger = new Logger(AuthServico.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email') private readonly filaEmail: Queue,
  ) {}

  async login(
    dados: LoginEntrada,
    contexto: { ip?: string; userAgent?: string },
  ): Promise<LoginSaida> {
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
      if (!validarCodigoMfa(dados.codigoMfa, usuario.mfaSegredo)) {
        throw new UnauthorizedException('Código MFA inválido');
      }
    }

    const vinculo = usuario.vinculos[0];
    if (!vinculo) throw new UnauthorizedException('Usuário sem vínculo a escritório');

    const tokenAcesso = await this.emitirAcesso(usuario.id, vinculo);
    const tokenRefresh = await this.criarSessao(usuario.id, contexto);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLoginEm: new Date() },
    });

    return {
      tokenAcesso,
      tokenRefresh,
      expiraEm: TTL_ACESSO_SEGUNDOS,
      exigeMfa: false,
    };
  }

  async renovar(
    dados: RefreshEntrada,
    contexto: { ip?: string; userAgent?: string },
  ): Promise<LoginSaida> {
    const hash = hashTexto(dados.tokenRefresh);
    const sessao = await this.prisma.sessao.findUnique({
      where: { refreshTokenHash: hash },
      include: {
        usuario: { include: { vinculos: { take: 1 } } },
      },
    });

    if (!sessao) throw new UnauthorizedException('Token inválido');

    if (sessao.revogadaEm) {
      // Reuse-detection: token revogado sendo reapresentado → revoga toda a família.
      this.logger.warn(
        `reuso de refresh token detectado familiaId=${sessao.familiaId} usuarioId=${sessao.usuarioId}`,
      );
      await this.prisma.sessao.updateMany({
        where: { familiaId: sessao.familiaId, revogadaEm: null },
        data: { revogadaEm: new Date(), motivoRevogacao: 'reuse_detectado' },
      });
      throw new UnauthorizedException('Token reusado — todas as sessões foram revogadas');
    }

    if (sessao.expiraEm < new Date()) {
      throw new UnauthorizedException('Token expirado');
    }

    const vinculo = sessao.usuario.vinculos[0];
    if (!vinculo) throw new UnauthorizedException('Vínculo ausente');

    const novoRefresh = randomBytes(48).toString('base64url');
    const novoHash = hashTexto(novoRefresh);
    const expiraEm = new Date(Date.now() + TTL_REFRESH_MS);

    await this.prisma.$transaction([
      this.prisma.sessao.update({
        where: { id: sessao.id },
        data: { revogadaEm: new Date(), motivoRevogacao: 'rotacionada' },
      }),
      this.prisma.sessao.create({
        data: {
          usuarioId: sessao.usuarioId,
          familiaId: sessao.familiaId,
          geracaoToken: sessao.geracaoToken + 1,
          refreshTokenHash: novoHash,
          ip: contexto.ip ?? null,
          userAgent: contexto.userAgent ?? null,
          expiraEm,
        },
      }),
    ]);

    const tokenAcesso = await this.emitirAcesso(sessao.usuarioId, vinculo);
    return {
      tokenAcesso,
      tokenRefresh: novoRefresh,
      expiraEm: TTL_ACESSO_SEGUNDOS,
      exigeMfa: false,
    };
  }

  async logout(tokenRefresh: string): Promise<void> {
    if (!tokenRefresh) return;
    const hash = hashTexto(tokenRefresh);
    await this.prisma.sessao.updateMany({
      where: { refreshTokenHash: hash, revogadaEm: null },
      data: { revogadaEm: new Date(), motivoRevogacao: 'logout' },
    });
  }

  async logoutTodas(usuarioId: string): Promise<void> {
    await this.prisma.sessao.updateMany({
      where: { usuarioId, revogadaEm: null },
      data: { revogadaEm: new Date(), motivoRevogacao: 'logout_todas' },
    });
  }

  async iniciarMfa(usuarioId: string): Promise<IniciarMfaSaida> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { email: true },
    });
    if (!usuario) throw new UnauthorizedException('Usuário inválido');
    const segredo = gerarSegredoMfa();
    const uri = gerarUriMfa('ContabilPro', usuario.email, segredo);
    return { segredo, uri };
  }

  async ativarMfa(usuarioId: string, dados: AtivarMfaEntrada): Promise<void> {
    if (!validarCodigoMfa(dados.codigo, dados.segredo)) {
      throw new BadRequestException('Código MFA inválido para o segredo informado');
    }
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaSegredo: dados.segredo, mfaAtivo: true },
    });
  }

  async desativarMfa(usuarioId: string, dados: DesativarMfaEntrada): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario?.senhaHash || !usuario.mfaSegredo) {
      throw new BadRequestException('MFA não está ativo');
    }
    const senhaOk = await verificarSenha(usuario.senhaHash, dados.senha);
    if (!senhaOk) throw new UnauthorizedException('Senha incorreta');
    if (!validarCodigoMfa(dados.codigo, usuario.mfaSegredo)) {
      throw new BadRequestException('Código MFA inválido');
    }
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaSegredo: null, mfaAtivo: false },
    });
  }

  async solicitarRecuperacao(
    dados: RecuperarSenhaEntrada,
    contexto: { ip?: string },
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dados.email } });
    // Resposta uniforme para não vazar existência de e-mail.
    if (!usuario || usuario.status !== 'ATIVO') return;

    const token = randomBytes(32).toString('base64url');
    const hash = hashTexto(token);
    const expiraEm = new Date(Date.now() + TTL_RECUPERACAO_MS);

    await this.prisma.tokenRecuperacao.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hash,
        expiraEm,
        ip: contexto.ip ?? null,
      },
    });

    const env = configurarEnv();
    const link = `${env.WEB_URL}/redefinir-senha?token=${token}`;
    await this.filaEmail.add(
      'enviar',
      {
        para: usuario.email,
        assunto: 'Redefinição de senha — ContábilPro',
        corpoHtml: `<p>Olá ${usuario.nome},</p><p>Para redefinir sua senha, acesse <a href="${link}">${link}</a>. O link expira em 1 hora.</p>`,
        corpoTexto: `Olá ${usuario.nome}, para redefinir sua senha acesse ${link} (expira em 1 hora).`,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  async redefinirSenha(dados: RedefinirSenhaEntrada): Promise<void> {
    const hash = hashTexto(dados.token);
    const token = await this.prisma.tokenRecuperacao.findUnique({
      where: { tokenHash: hash },
    });
    if (!token || token.usadoEm || token.expiraEm < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const senhaHash = await gerarHashSenha(dados.novaSenha);

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: token.usuarioId },
        data: { senhaHash },
      }),
      this.prisma.tokenRecuperacao.update({
        where: { id: token.id },
        data: { usadoEm: new Date() },
      }),
      this.prisma.sessao.updateMany({
        where: { usuarioId: token.usuarioId, revogadaEm: null },
        data: { revogadaEm: new Date(), motivoRevogacao: 'senha_redefinida' },
      }),
    ]);
  }

  private emitirAcesso(
    usuarioId: string,
    vinculo: { escritorioId: string; papel: string; permissoes: string[] },
  ): Promise<string> {
    const env = configurarEnv();
    return emitirTokenAcesso(
      {
        sub: usuarioId,
        escritorioId: vinculo.escritorioId,
        papel: vinculo.papel,
        permissoes: vinculo.permissoes,
      },
      env.JWT_PRIVATE_KEY,
      TTL_ACESSO_SEGUNDOS,
    );
  }

  private async criarSessao(
    usuarioId: string,
    contexto: { ip?: string; userAgent?: string },
  ): Promise<string> {
    const tokenRefresh = randomBytes(48).toString('base64url');
    const hash = hashTexto(tokenRefresh);
    const expiraEm = new Date(Date.now() + TTL_REFRESH_MS);
    await this.prisma.sessao.create({
      data: {
        usuarioId,
        familiaId: randomUUID(),
        geracaoToken: 0,
        refreshTokenHash: hash,
        ip: contexto.ip ?? null,
        userAgent: contexto.userAgent ?? null,
        expiraEm,
      },
    });
    return tokenRefresh;
  }
}
