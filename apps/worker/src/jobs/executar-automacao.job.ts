
import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';

import { aplicarTemplate, aplicarTemplateObjeto } from '../engine/templates.js';

import type { Job, Queue } from 'bullmq';

interface Dependencias {
  filaNotificacoes: Queue;
  filaEmail: Queue;
  filaWhatsapp: Queue;
}

interface PayloadExecutarAutomacao {
  automacaoId: string;
  escritorioId: string;
  evento: { tipo: string; payload: Record<string, unknown> };
}

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

export function criarExecutarAutomacao({
  filaNotificacoes,
  filaEmail,
  filaWhatsapp,
}: Dependencias) {
  return async function executarAutomacao(job: Job<PayloadExecutarAutomacao>): Promise<void> {
    const { automacaoId, escritorioId, evento } = job.data;
    const automacao = await prisma.automacao.findUnique({ where: { id: automacaoId } });
    if (!automacao || automacao.status !== 'ATIVA') {
      logger.warn({ jobId: job.id, automacaoId }, 'automação inexistente ou inativa — pulando');
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
    const contexto: Record<string, unknown> = { ...evento.payload, evento: { tipo: evento.tipo } };

    try {
      for (let i = 0; i < passos.length; i += 1) {
        const passo = passos[i]!;
        await executarPasso(passo, contexto, escritorioId, {
          filaNotificacoes,
          filaEmail,
          filaWhatsapp,
        });
      }

      await prisma.execucaoAutomacao.update({
        where: { id: execucao.id },
        data: { status: 'CONCLUIDA', finalizadaEm: new Date() },
      });
      logger.info(
        { jobId: job.id, automacaoId, passos: passos.length },
        'automação executada com sucesso',
      );
    } catch (erro) {
      const mensagem = (erro as Error).message;
      await prisma.execucaoAutomacao.update({
        where: { id: execucao.id },
        data: { status: 'FALHOU', finalizadaEm: new Date(), erro: mensagem.slice(0, 1000) },
      });
      logger.error(
        { jobId: job.id, automacaoId, erro: mensagem },
        'automação falhou na execução',
      );
      throw erro;
    }
  };
}

async function executarPasso(
  passo: Passo,
  contexto: Record<string, unknown>,
  escritorioId: string,
  filas: Dependencias,
): Promise<void> {
  switch (passo.tipo) {
    case 'CRIAR_NOTIFICACAO': {
      const c = aplicarTemplateObjeto(passo.config, contexto);
      await filas.filaNotificacoes.add('enviar', {
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
      await filas.filaEmail.add('enviar', {
        para: c.para,
        assunto: c.assunto,
        corpoHtml: c.corpoHtml,
        corpoTexto: c.corpoTexto ?? c.corpoHtml.replace(/<[^>]+>/g, ''),
      });
      return;
    }
    case 'ENVIAR_WHATSAPP': {
      const c = aplicarTemplateObjeto(passo.config, contexto);
      await filas.filaWhatsapp.add('enviar-direto', {
        escritorioId,
        // payload reduzido: sem conversaId, motor envia direto pelo número.
        texto: c.texto,
        telefone: c.para,
        origem: 'automacao',
      });
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
