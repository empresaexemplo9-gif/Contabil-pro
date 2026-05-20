import { prisma } from '@contabilpro/database';
import {
  criarDocumentoZapsign,
  type CredenciaisZapsign,
} from '@contabilpro/integracoes';
import { logger } from '@contabilpro/logger';
import { z } from 'zod';

import { gerarUrlDownload } from './_lib/storage';

export const PayloadEnviarAssinatura = z.object({
  escritorioId: z.string().uuid(),
  solicitacaoId: z.string().uuid(),
  documentoId: z.string().uuid(),
  nomeDocumento: z.string(),
  signatarios: z.array(
    z.object({
      nome: z.string(),
      email: z.string().email(),
      cpf: z.string().optional(),
    }),
  ),
  expiraEm: z.string().nullable(),
});
export type PayloadEnviarAssinatura = z.infer<typeof PayloadEnviarAssinatura>;

export async function enviarAssinatura(payloadBruto: unknown): Promise<void> {
  const { escritorioId, solicitacaoId, documentoId, nomeDocumento, signatarios, expiraEm } =
    PayloadEnviarAssinatura.parse(payloadBruto);

  const integracao = await prisma.integracao.findFirst({
    where: { escritorioId, provedor: 'ZAPSIGN', status: 'ATIVA' },
    select: { id: true, credenciais: true },
  });
  if (!integracao) {
    logger.warn(
      { escritorioId },
      'sem integração ZAPSIGN ativa — solicitação fica como RASCUNHO',
    );
    return;
  }
  const credenciais = integracao.credenciais as Partial<CredenciaisZapsign>;
  if (!credenciais.apiToken) {
    throw new Error('Credenciais ZapSign incompletas (faltando apiToken)');
  }

  const documento = await prisma.documento.findUnique({
    where: { id: documentoId },
    select: { chaveStorage: true },
  });
  if (!documento) throw new Error(`Documento ${documentoId} não encontrado`);

  const urlPdf = await gerarUrlDownload(documento.chaveStorage, 900);

  try {
    const criado = await criarDocumentoZapsign(
      { apiToken: credenciais.apiToken },
      {
        nome: nomeDocumento,
        urlPdf,
        signatarios,
        dataLimite: expiraEm ?? undefined,
      },
    );

    await prisma.solicitacaoAssinatura.update({
      where: { id: solicitacaoId },
      data: {
        externalId: criado.externalId,
        status: 'ENVIADA',
        enviadaEm: new Date(),
      },
    });

    logger.info(
      { solicitacaoId, externalId: criado.externalId },
      'documento enviado ao ZapSign',
    );
  } catch (erro) {
    const mensagem = (erro as Error).message;
    await prisma.integracao.update({
      where: { id: integracao.id },
      data: { ultimoErro: mensagem.slice(0, 500) },
    });
    throw erro;
  }
}
