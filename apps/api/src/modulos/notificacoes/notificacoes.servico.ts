import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

import type { Queue } from 'bullmq';


@Injectable()
export class NotificacoesServico {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notificacoes') private readonly fila: Queue,
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
    await this.fila.add('enviar', payload, {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
