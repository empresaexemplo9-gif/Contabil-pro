import { parsearWebhookZapsign } from '@contabilpro/integracoes';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../comum/prisma/prisma.service';


@Injectable()
export class ZapsignServico {
  private readonly logger = new Logger(ZapsignServico.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recebe payload de webhook do ZapSign e atualiza:
   * - status do signatário individual (ASSINADO/RECUSADO) com timestamp
   * - status da solicitação agregada (PARCIAL/CONCLUIDA/CANCELADA/EXPIRADA)
   *
   * Idempotente: re-aplicação do mesmo evento não regride status nem
   * duplica timestamps (campos só são gravados na primeira vez).
   */
  async processarWebhook(payload: unknown): Promise<{ atualizado: boolean }> {
    const evento = parsearWebhookZapsign(payload);
    if (!evento) {
      this.logger.warn('webhook ZapSign sem documento identificável');
      return { atualizado: false };
    }

    const solicitacao = await this.prisma.solicitacaoAssinatura.findFirst({
      where: { externalId: evento.documentoExternalId },
      include: { signatarios: true },
    });
    if (!solicitacao) {
      this.logger.warn(
        `webhook ZapSign para externalId desconhecido: ${evento.documentoExternalId}`,
      );
      return { atualizado: false };
    }

    if (evento.signatarioEmail && evento.signatarioStatus) {
      const signatario = solicitacao.signatarios.find(
        (s) => s.email.toLowerCase() === evento.signatarioEmail?.toLowerCase(),
      );
      if (signatario && signatario.status === 'PENDENTE') {
        await this.prisma.signatario.update({
          where: { id: signatario.id },
          data: {
            status: evento.signatarioStatus,
            assinadoEm: evento.signatarioStatus === 'ASSINADO' ? new Date() : null,
          },
        });
      }
    }

    if (evento.documentoStatus) {
      const atualizacoes: Record<string, unknown> = { status: evento.documentoStatus };
      if (evento.documentoStatus === 'CONCLUIDA' && !solicitacao.concluidaEm) {
        atualizacoes.concluidaEm = new Date();
      }
      await this.prisma.solicitacaoAssinatura.update({
        where: { id: solicitacao.id },
        data: atualizacoes,
      });
    }

    return { atualizado: true };
  }
}
