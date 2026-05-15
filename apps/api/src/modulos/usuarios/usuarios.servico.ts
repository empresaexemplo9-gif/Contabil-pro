import { randomBytes } from 'node:crypto';

import { gerarHashSenha } from '@contabilpro/auth-core';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type { AtualizarPapelEntrada, CriarUsuarioEntrada } from '@contabilpro/contracts';

@Injectable()
export class UsuariosServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaServico,
  ) {}

  async obterPerfil(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        avatarUrl: true,
        telefone: true,
        mfaAtivo: true,
        criadoEm: true,
        vinculos: { select: { escritorioId: true, papel: true, permissoes: true } },
      },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async listarDoEscritorio(escritorioId: string) {
    return this.prisma.vinculoUsuario.findMany({
      where: { escritorioId },
      include: {
        usuario: { select: { id: true, email: true, nome: true, status: true } },
      },
    });
  }

  /**
   * Criação de usuário pelo escritório.
   *
   * Por design, NÃO existe cadastro público no produto — apenas PROPRIETARIO
   * e ADMIN podem chamar este método para convidar novos membros (internos)
   * ou vincular contas-cliente. A regra é reforçada na camada de controller
   * via @Papeis e na de serviço pelo próprio fluxo (ator é obrigatório).
   *
   * Se `senhaTemporaria` for omitida, geramos uma e devolvemos no retorno
   * (uma única vez) para o admin compartilhar manualmente com o convidado.
   */
  async criar(ator: UsuarioAutenticado, dados: CriarUsuarioEntrada) {
    const emailNormalizado = dados.email.toLowerCase();

    if (dados.papel === 'CLIENTE') {
      if (!dados.empresaId) {
        throw new BadRequestException('CLIENTE exige empresaId');
      }
      const empresa = await this.prisma.empresa.findFirst({
        where: { id: dados.empresaId, escritorioId: ator.escritorioId },
        select: { id: true },
      });
      if (!empresa) throw new NotFoundException('Empresa não encontrada');
    } else if (dados.empresaId) {
      throw new BadRequestException('Apenas CLIENTE pode ter empresaId vinculado');
    }

    const senhaUsada = dados.senhaTemporaria ?? this.gerarSenhaTemporaria();
    const senhaHash = await gerarHashSenha(senhaUsada);

    const usuario = await this.prisma.usuario.upsert({
      where: { email: emailNormalizado },
      update: {},
      create: {
        email: emailNormalizado,
        nome: dados.nome,
        telefone: dados.telefone ?? null,
        senhaHash,
        status: 'ATIVO',
        emailVerificado: false,
      },
    });

    const jaVinculado = await this.prisma.vinculoUsuario.findUnique({
      where: {
        usuarioId_escritorioId: {
          usuarioId: usuario.id,
          escritorioId: ator.escritorioId,
        },
      },
    });
    if (jaVinculado) {
      throw new ConflictException('Usuário já vinculado a este escritório');
    }

    await this.prisma.vinculoUsuario.create({
      data: {
        usuarioId: usuario.id,
        escritorioId: ator.escritorioId,
        papel: dados.papel,
        empresaId: dados.empresaId ?? null,
      },
    });

    await this.auditoria.registrar({
      escritorioId: ator.escritorioId,
      atorId: ator.id,
      acao: 'usuario.criado',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      diff: { papel: dados.papel, empresaId: dados.empresaId ?? null },
    });

    return {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      papel: dados.papel,
      // Só devolvemos a senha gerada quando o admin não informou uma. Mostre na
      // tela apenas uma vez — não fica armazenada em lugar nenhum.
      senhaTemporaria: dados.senhaTemporaria ? undefined : senhaUsada,
    };
  }

  async atualizarPapel(
    ator: UsuarioAutenticado,
    usuarioId: string,
    dados: AtualizarPapelEntrada,
  ) {
    if (ator.id === usuarioId && dados.papel !== 'PROPRIETARIO') {
      throw new BadRequestException('Não é possível rebaixar o próprio papel');
    }
    const vinculo = await this.prisma.vinculoUsuario.findUnique({
      where: {
        usuarioId_escritorioId: { usuarioId, escritorioId: ator.escritorioId },
      },
    });
    if (!vinculo) throw new NotFoundException('Vínculo não encontrado');

    await this.prisma.vinculoUsuario.update({
      where: { id: vinculo.id },
      data: {
        papel: dados.papel,
        empresaId: dados.empresaId ?? null,
      },
    });

    await this.auditoria.registrar({
      escritorioId: ator.escritorioId,
      atorId: ator.id,
      acao: 'usuario.papel.alterado',
      entidade: 'Usuario',
      entidadeId: usuarioId,
      diff: { de: vinculo.papel, para: dados.papel },
    });

    return { ok: true };
  }

  async desativar(ator: UsuarioAutenticado, usuarioId: string) {
    if (ator.id === usuarioId) {
      throw new BadRequestException('Não é possível desativar o próprio usuário');
    }
    const vinculo = await this.prisma.vinculoUsuario.findUnique({
      where: {
        usuarioId_escritorioId: { usuarioId, escritorioId: ator.escritorioId },
      },
    });
    if (!vinculo) throw new NotFoundException('Vínculo não encontrado');

    await this.prisma.$transaction([
      this.prisma.vinculoUsuario.delete({ where: { id: vinculo.id } }),
      this.prisma.sessao.updateMany({
        where: { usuarioId, revogadaEm: null },
        data: { revogadaEm: new Date(), motivoRevogacao: 'usuario_desativado' },
      }),
    ]);

    await this.auditoria.registrar({
      escritorioId: ator.escritorioId,
      atorId: ator.id,
      acao: 'usuario.desativado',
      entidade: 'Usuario',
      entidadeId: usuarioId,
    });

    return { ok: true };
  }

  private gerarSenhaTemporaria(): string {
    return `Cp@${randomBytes(9).toString('base64url')}1`;
  }
}
