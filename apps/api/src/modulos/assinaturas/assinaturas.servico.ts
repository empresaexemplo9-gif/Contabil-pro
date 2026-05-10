import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { criarSolicitacaoAssinaturaSchema } from '@contabilpro/contracts';

import { configurarEnv } from '../../config/env';
import { PrismaService } from '../../comum/prisma/prisma.service';

type CriarSolicitacao = z.infer<typeof criarSolicitacaoAssinaturaSchema>;

@Injectable()
export class AssinaturasServico {
  constructor(private readonly prisma: PrismaService) {}

  listar(escritorioId: string) {
    return this.prisma.solicitacaoAssinatura.findMany({
      where: { escritorioId },
      include: { signatarios: true, documento: { select: { nome: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async obter(escritorioId: string, id: string) {
    const solicitacao = await this.prisma.solicitacaoAssinatura.findFirst({
      where: { id, escritorioId },
      include: { signatarios: true },
    });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada');
    return solicitacao;
  }

  criar(escritorioId: string, dados: CriarSolicitacao) {
    const env = configurarEnv();
    return this.prisma.solicitacaoAssinatura.create({
      data: {
        escritorioId,
        documentoId: dados.documentoId,
        provedor: env.ASSINATURA_PROVEDOR,
        expiraEm: dados.expiraEm ?? null,
        signatarios: {
          create: dados.signatarios.map((s) => ({
            nome: s.nome,
            email: s.email,
            cpf: s.cpf ?? null,
            ordem: s.ordem,
          })),
        },
      },
      include: { signatarios: true },
    });
  }

  async cancelar(escritorioId: string, id: string) {
    await this.obter(escritorioId, id);
    return this.prisma.solicitacaoAssinatura.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });
  }
}
