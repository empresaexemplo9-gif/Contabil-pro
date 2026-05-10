import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

@Injectable()
export class FaturamentoServico {
  constructor(private readonly prisma: PrismaService) {}

  async obterPlano(escritorioId: string) {
    const escritorio = await this.prisma.escritorio.findUnique({
      where: { id: escritorioId },
      select: { plano: true, status: true },
    });
    if (!escritorio) throw new NotFoundException('Escritório não encontrado');
    return escritorio;
  }
}
