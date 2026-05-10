import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

@Injectable()
export class EscritoriosServico {
  constructor(private readonly prisma: PrismaService) {}

  async obter(id: string) {
    const escritorio = await this.prisma.escritorio.findUnique({ where: { id } });
    if (!escritorio) throw new NotFoundException('Escritório não encontrado');
    return escritorio;
  }
}
