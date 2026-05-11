import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

import type { Condicao, EventoDispatch, Gatilho, TipoGatilho } from '@contabilpro/contracts';
import type { Queue } from 'bullmq';



/**
 * Despacha eventos de domínio para a engine de automações. Os serviços
 * de negócio (Tarefas, Documentos, Atendimento, etc) chamam `disparar()`
 * em pontos chave; o dispatcher consulta automações ativas com gatilho
 * casando o tipo do evento, aplica as condições no payload e enfileira
 * uma execução assíncrona por match.
 *
 * Falhas no dispatcher NUNCA propagam para o caller — uma automação
 * mal configurada não pode quebrar o fluxo de negócio principal.
 */
@Injectable()
export class DispatcherAutomacoes {
  private readonly logger = new Logger(DispatcherAutomacoes.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('automacoes') private readonly fila: Queue,
  ) {}

  async disparar(evento: EventoDispatch): Promise<void> {
    try {
      const automacoes = await this.prisma.automacao.findMany({
        where: {
          escritorioId: evento.escritorioId,
          status: 'ATIVA',
        },
      });

      for (const automacao of automacoes) {
        const gatilho = automacao.gatilho as unknown as Gatilho;
        if (!gatilho || gatilho.tipo !== evento.tipo) continue;
        if (!casaCondicoes(gatilho.condicoes ?? [], evento.payload)) continue;

        await this.fila.add(
          'executar',
          {
            automacaoId: automacao.id,
            escritorioId: automacao.escritorioId,
            evento: { tipo: evento.tipo, payload: evento.payload },
          },
          { attempts: 3, backoff: { type: 'exponential', delay: 10_000 } },
        );
      }
    } catch (erro) {
      this.logger.error(
        `falha ao despachar automações para ${evento.tipo}: ${(erro as Error).message}`,
      );
    }
  }
}

function casaCondicoes(condicoes: Condicao[], payload: Record<string, unknown>): boolean {
  return condicoes.every((c) => avaliar(c, payload));
}

function avaliar(c: Condicao, payload: Record<string, unknown>): boolean {
  const valor = resolverCaminho(payload, c.campo);
  switch (c.operador) {
    case 'eq':
      return valor === c.valor;
    case 'neq':
      return valor !== c.valor;
    case 'contains':
      return typeof valor === 'string' && typeof c.valor === 'string' && valor.includes(c.valor);
    case 'in':
      return Array.isArray(c.valor) && c.valor.includes(valor as never);
    case 'gt':
      return typeof valor === 'number' && typeof c.valor === 'number' && valor > c.valor;
    case 'lt':
      return typeof valor === 'number' && typeof c.valor === 'number' && valor < c.valor;
    default:
      return false;
  }
}

function resolverCaminho(obj: Record<string, unknown>, caminho: string): unknown {
  return caminho.split('.').reduce<unknown>((acc, parte) => {
    if (acc && typeof acc === 'object' && parte in (acc as object)) {
      return (acc as Record<string, unknown>)[parte];
    }
    return undefined;
  }, obj);
}

export type { TipoGatilho };
