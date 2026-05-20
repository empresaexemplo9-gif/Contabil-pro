import { prisma } from '@contabilpro/database';
import {
  enviarMensagemWhatsapp,
  type CredenciaisWhatsapp,
} from '@contabilpro/integracoes';
import { logger } from '@contabilpro/logger';
import { z } from 'zod';

export const PayloadWhatsapp = z.object({
  escritorioId: z.string().uuid(),
  conversaId: z.string().uuid(),
  mensagemId: z.string().uuid(),
  texto: z.string().min(1),
});
export type PayloadWhatsapp = z.infer<typeof PayloadWhatsapp>;

/**
 * Envia uma mensagem outbound pela WhatsApp Cloud API. Persiste o wamid
 * em `mensagem.externalId` para dedup caso o webhook retorne o eco.
 */
export async function processarWhatsapp(payloadBruto: unknown): Promise<void> {
  const { escritorioId, conversaId, mensagemId, texto } = PayloadWhatsapp.parse(payloadBruto);

  const integracao = await prisma.integracao.findFirst({
    where: { escritorioId, provedor: 'WHATSAPP_CLOUD', status: 'ATIVA' },
    select: { id: true, credenciais: true },
  });
  if (!integracao) {
    logger.warn({ escritorioId }, 'sem integração WhatsApp ativa — descartando envio');
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
    logger.info({ wamid }, 'mensagem WhatsApp enviada');
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
