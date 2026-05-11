
import { prisma } from '@contabilpro/database';
import {
  enviarMensagemWhatsapp,
  type CredenciaisWhatsapp,
} from '@contabilpro/integracoes';
import { logger } from '@contabilpro/logger';


import type { Job } from 'bullmq';

interface PayloadWhatsapp {
  escritorioId: string;
  conversaId: string;
  mensagemId: string;
  texto: string;
}

/**
 * Envia uma mensagem outbound pela WhatsApp Cloud API. Busca:
 * - integração WHATSAPP_CLOUD ATIVA do escritório (credenciais)
 * - conversa para resolver o telefone alvo via empresa.contatos
 *
 * Em sucesso: persiste o wamid em `mensagem.externalId` para dedup
 * caso o webhook eventualmente retorne o eco.
 */
export async function processarWhatsapp(job: Job<PayloadWhatsapp>): Promise<void> {
  const { escritorioId, conversaId, mensagemId, texto } = job.data;

  const integracao = await prisma.integracao.findFirst({
    where: { escritorioId, provedor: 'WHATSAPP_CLOUD', status: 'ATIVA' },
    select: { id: true, credenciais: true },
  });
  if (!integracao) {
    logger.warn(
      { jobId: job.id, escritorioId },
      'sem integração WhatsApp ativa — descartando envio',
    );
    return;
  }

  const credenciais = integracao.credenciais as Partial<CredenciaisWhatsapp>;
  if (!credenciais.phoneNumberId || !credenciais.token) {
    throw new Error('Credenciais WhatsApp incompletas');
  }

  const telefone = await resolverTelefone(conversaId);
  if (!telefone) {
    throw new Error(`Conversa ${conversaId} sem telefone alvo`);
  }

  try {
    const { wamid } = await enviarMensagemWhatsapp(
      { phoneNumberId: credenciais.phoneNumberId, token: credenciais.token },
      telefone,
      texto,
    );
    await prisma.mensagem.update({
      where: { id: mensagemId },
      data: { externalId: wamid },
    });
    logger.info({ jobId: job.id, wamid }, 'mensagem WhatsApp enviada');
  } catch (erro) {
    const mensagemErro = (erro as Error).message;
    await prisma.integracao.update({
      where: { id: integracao.id },
      data: { ultimoErro: mensagemErro.slice(0, 500) },
    });
    throw erro;
  }
}

async function resolverTelefone(conversaId: string): Promise<string | null> {
  const conversa = await prisma.conversa.findUnique({
    where: { id: conversaId },
    select: {
      empresa: {
        select: {
          contatos: {
            where: { telefone: { not: null } },
            orderBy: { principal: 'desc' },
            select: { telefone: true },
            take: 1,
          },
        },
      },
    },
  });
  const tel = conversa?.empresa?.contatos[0]?.telefone ?? null;
  return tel ? tel.replace(/\D/g, '') : null;
}
