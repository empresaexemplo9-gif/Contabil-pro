import { Injectable } from '@nestjs/common';

import { FilaServico } from '../../comum/fila/fila.module';
import { PrismaService } from '../../comum/prisma/prisma.service';

@Injectable()
export class NotificacoesServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fila: FilaServico,
  ) {}

  listarParaUsuario(usuarioId: string) {
    return this.prisma.notificacao.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
  }

  marcarLida(usuarioId: string, id: string) {
    return this.prisma.notificacao.updateMany({
      where: { id, usuarioId, lidaEm: null },
      data: { lidaEm: new Date() },
    });
  }

  async enfileirar(payload: {
    escritorioId: string;
    usuarioId: string;
    tipo: string;
    canal: string;
    titulo: string;
    corpo: string;
    dados?: Record<string, unknown>;
  }): Promise<void> {
    await this.fila.publicar('enviar-notificacao', payload);
  }
}
