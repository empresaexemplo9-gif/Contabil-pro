
import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';

import { gerarUrlDownload } from '../adapters/storage.adapter.js';
import { criarDocumento, type CredenciaisZapsign } from '../adapters/zapsign.adapter.js';

import type { Job } from 'bullmq';

interface PayloadEnviarAssinatura {
  escritorioId: string;
  solicitacaoId: string;
  documentoId: string;
  nomeDocumento: string;
  signatarios: Array<{ nome: string; email: string; cpf?: string }>;
  expiraEm: string | null;
}

/**
 * Envia o documento para o provedor de assinatura. Hoje suportamos ZapSign;
 * a estratégia: localizar credenciais do tenant, gerar URL presignada do
 * arquivo no S3, enviar para a ZapSign e persistir externalId na
 * solicitação + status ENVIADA.
 */
export async function enviarAssinatura(job: Job<PayloadEnviarAssinatura>): Promise<void> {
  const { escritorioId, solicitacaoId, documentoId, nomeDocumento, signatarios, expiraEm } =
    job.data;

  const integracao = await prisma.integracao.findFirst({
    where: { escritorioId, provedor: 'ZAPSIGN', status: 'ATIVA' },
    select: { id: true, credenciais: true },
  });
  if (!integracao) {
    logger.warn(
      { jobId: job.id, escritorioId },
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
    const criado = await criarDocumento(
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
      { jobId: job.id, solicitacaoId, externalId: criado.externalId },
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
