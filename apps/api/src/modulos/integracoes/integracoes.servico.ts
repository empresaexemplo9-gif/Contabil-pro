import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../comum/prisma/prisma.service';

@Injectable()
export class IntegracoesServico {
  constructor(private readonly prisma: PrismaService) {}

  listar(escritorioId: string) {
    return this.prisma.integracao.findMany({
      where: { escritorioId },
      select: {
        id: true,
        provedor: true,
        nome: true,
        status: true,
        ultimoErro: true,
        criadoEm: true,
      },
    });
  }

  async registrarEventoWebhook(escritorioId: string | null, origem: string, payload: unknown) {
    return this.prisma.eventoWebhook.create({
      data: {
        escritorioId,
        origem,
        payload: payload as object,
      },
    });
  }
}
