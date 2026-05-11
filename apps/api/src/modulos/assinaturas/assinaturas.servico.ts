import { criarSolicitacaoAssinaturaSchema } from '@contabilpro/contracts';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { PrismaService } from '../../comum/prisma/prisma.service';
import { configurarEnv } from '../../config/env';

import type { Queue } from 'bullmq';

type CriarSolicitacao = z.infer<typeof criarSolicitacaoAssinaturaSchema>;

@Injectable()
export class AssinaturasServico {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('assinaturas') private readonly fila: Queue,
  ) {}

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

  async criar(escritorioId: string, dados: CriarSolicitacao) {
    const env = configurarEnv();
    const documento = await this.prisma.documento.findFirst({
      where: { id: dados.documentoId, escritorioId },
      select: { id: true, nome: true },
    });
    if (!documento) throw new NotFoundException('Documento não encontrado');

    const solicitacao = await this.prisma.solicitacaoAssinatura.create({
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

    // Envio real é feito pelo worker (precisa de URL presignada, retries,
    // call externa). Aqui só enfileiramos com attempts + backoff exponencial.
    await this.fila.add(
      'enviar',
      {
        escritorioId,
        solicitacaoId: solicitacao.id,
        documentoId: documento.id,
        nomeDocumento: documento.nome,
        signatarios: dados.signatarios,
        expiraEm: dados.expiraEm?.toISOString() ?? null,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 10_000 } },
    );

    return solicitacao;
  }

  async cancelar(escritorioId: string, id: string) {
    await this.obter(escritorioId, id);
    return this.prisma.solicitacaoAssinatura.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });
  }
}
