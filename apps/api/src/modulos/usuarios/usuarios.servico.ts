import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

@Injectable()
export class UsuariosServico {
  constructor(private readonly prisma: PrismaService) {}

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
}
