import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';
import { z } from 'zod';

import { publicarJob } from '../comum/fila/fila';

import { aplicarTemplate, aplicarTemplateObjeto } from './_lib/templates';

export const PayloadExecutarAutomacao = z.object({
  automacaoId: z.string().uuid(),
  escritorioId: z.string().uuid(),
  evento: z.object({
    tipo: z.string(),
    payload: z.record(z.unknown()),
  }),
});
export type PayloadExecutarAutomacao = z.infer<typeof PayloadExecutarAutomacao>;

type Passo =
  | { tipo: 'CRIAR_NOTIFICACAO'; config: ConfigNotificacao }
  | { tipo: 'ENVIAR_EMAIL'; config: ConfigEmail }
  | { tipo: 'ENVIAR_WHATSAPP'; config: ConfigWhatsapp }
  | { tipo: 'CRIAR_TAREFA'; config: ConfigCriarTarefa };

interface ConfigNotificacao {
  usuarioId: string;
  titulo: string;
  corpo: string;
  tipo: string;
}
interface ConfigEmail {
  para: string;
  assunto: string;
  corpoHtml: string;
  corpoTexto?: string;
}
interface ConfigWhatsapp {
  para: string;
  texto: string;
}
interface ConfigCriarTarefa {
  titulo: string;
  descricao?: string;
  dataVencimento: string;
  empresaId?: string;
  responsavelId?: string;
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
}

export async function executarAutomacao(payloadBruto: unknown): Promise<void> {
  const { automacaoId, escritorioId, evento } = PayloadExecutarAutomacao.parse(payloadBruto);

  const automacao = await prisma.automacao.findUnique({ where: { id: automacaoId } });
  if (!automacao || automacao.status !== 'ATIVA') {
    logger.warn({ automacaoId }, 'automação inexistente ou inativa — pulando');
    return;
  }

  const execucao = await prisma.execucaoAutomacao.create({
    data: {
      automacaoId,
      status: 'EXECUTANDO',
      contexto: evento as object,
    },
  });

  const passos = automacao.passos as unknown as Passo[];
  const contexto: Record<string, unknown> = {
    ...evento.payload,
    evento: { tipo: evento.tipo },
  };

  try {
    for (let i = 0; i < passos.length; i += 1) {
      const passo = passos[i]!;
      await executarPasso(passo, contexto, escritorioId);
    }

    await prisma.execucaoAutomacao.update({
      where: { id: execucao.id },
      data: { status: 'CONCLUIDA', finalizadaEm: new Date() },
    });
    logger.info({ automacaoId, passos: passos.length }, 'automação executada com sucesso');
  } catch (erro) {
    const mensagem = (erro as Error).message;
    await prisma.execucaoAutomacao.update({
      where: { id: execucao.id },
      data: { status: 'FALHOU', finalizadaEm: new Date(), erro: mensagem.slice(0, 1000) },
    });
    logger.error({ automacaoId, erro: mensagem }, 'automação falhou na execução');
    throw erro;
  }
}

async function executarPasso(
  passo: Passo,
  contexto: Record<string, unknown>,
  escritorioId: string,
): Promise<void> {
  switch (passo.tipo) {
    case 'CRIAR_NOTIFICACAO': {
      const c = aplicarTemplateObjeto(passo.config, contexto);
      await publicarJob('enviar-notificacao', {
        escritorioId,
        usuarioId: c.usuarioId,
        tipo: c.tipo,
        canal: 'IN_APP',
        titulo: c.titulo,
        corpo: c.corpo,
        dados: { origem: 'automacao' },
      });
      return;
    }
    case 'ENVIAR_EMAIL': {
      const c = aplicarTemplateObjeto(passo.config, contexto);
      await publicarJob('enviar-email', {
        para: c.para,
        assunto: c.assunto,
        corpoHtml: c.corpoHtml,
        corpoTexto: c.corpoTexto ?? c.corpoHtml.replace(/<[^>]+>/g, ''),
      });
      return;
    }
    case 'ENVIAR_WHATSAPP': {
      // Passo de automação envia direto por número, sem conversa.
      // Job whatsapp atual exige conversaId — passo está stub até refatorar.
      logger.warn({ passo }, 'passo ENVIAR_WHATSAPP em automação ainda não suportado');
      return;
    }
    case 'CRIAR_TAREFA': {
      const c = passo.config;
      const dataStr = aplicarTemplate(c.dataVencimento, contexto);
      const data = new Date(dataStr);
      if (Number.isNaN(data.getTime())) {
        throw new Error(`dataVencimento inválida após template: "${dataStr}"`);
      }
      await prisma.tarefa.create({
        data: {
          escritorioId,
          titulo: aplicarTemplate(c.titulo, contexto),
          descricao: c.descricao ? aplicarTemplate(c.descricao, contexto) : null,
          dataVencimento: data,
          prioridade: c.prioridade ?? 'MEDIA',
          empresaId: c.empresaId ? aplicarTemplate(c.empresaId, contexto) : null,
          responsavelId: c.responsavelId ? aplicarTemplate(c.responsavelId, contexto) : null,
        },
      });
      return;
    }
    default: {
      const exhaustivo: never = passo;
      throw new Error(`Tipo de passo desconhecido: ${JSON.stringify(exhaustivo)}`);
    }
  }
}
