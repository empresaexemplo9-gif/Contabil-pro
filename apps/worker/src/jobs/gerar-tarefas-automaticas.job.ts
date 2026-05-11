
import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';

import { calcularVencimento, proximoMes } from '../utilitarios/vencimento.js';

import type { Job } from 'bullmq';

interface PayloadGeradorTarefas {
  // Permite override pra testes; em produção o agendador dispara sem payload
  // e o job calcula o próximo mês automaticamente.
  mes?: number;
  ano?: number;
}

/**
 * Cron mensal: para cada ModeloObrigacao ativo, gera tarefas para o próximo
 * mês em cada empresa-cliente cujo regime tributário esteja contemplado pelo
 * modelo (ou todas se a lista de regimes for vazia).
 *
 * Idempotente: verifica por (modeloId, empresaId, dataVencimento).
 * Cross-tenant: roda sem GUC `app.escritorio_id`, lendo modelos de todos
 * os escritórios. A role do worker em produção deve ter BYPASSRLS.
 */
export async function gerarTarefasAutomaticas(job: Job<PayloadGeradorTarefas>): Promise<{
  modelosProcessados: number;
  tarefasGeradas: number;
  tarefasIgnoradas: number;
}> {
  const { mes, ano } = job.data.mes && job.data.ano
    ? { mes: job.data.mes, ano: job.data.ano }
    : proximoMes();

  const log = logger.child({ jobId: job.id, mes, ano });
  log.info('iniciando geração automática de tarefas');

  const modelos = await prisma.modeloObrigacao.findMany({
    where: { ativo: true, diaVencimento: { not: null } },
  });

  let tarefasGeradas = 0;
  let tarefasIgnoradas = 0;

  for (const modelo of modelos) {
    if (!modelo.diaVencimento) continue;
    if (modelo.frequencia === 'UNICA') continue;

    const dataVencimento = calcularVencimento(ano, mes, modelo.diaVencimento);

    const empresas = await prisma.empresa.findMany({
      where: {
        escritorioId: modelo.escritorioId,
        status: 'ATIVA',
        ...(modelo.regimes.length > 0 ? { regime: { in: modelo.regimes } } : {}),
      },
      select: { id: true, razaoSocial: true },
    });

    for (const empresa of empresas) {
      const existente = await prisma.tarefa.findFirst({
        where: {
          escritorioId: modelo.escritorioId,
          modeloId: modelo.id,
          empresaId: empresa.id,
          dataVencimento,
        },
        select: { id: true },
      });
      if (existente) {
        tarefasIgnoradas += 1;
        continue;
      }
      await prisma.tarefa.create({
        data: {
          escritorioId: modelo.escritorioId,
          empresaId: empresa.id,
          modeloId: modelo.id,
          titulo: `${modelo.nome} — ${empresa.razaoSocial}`,
          descricao: modelo.descricao,
          prioridade: 'MEDIA',
          dataVencimento,
        },
      });
      tarefasGeradas += 1;
    }
  }

  log.info(
    { modelosProcessados: modelos.length, tarefasGeradas, tarefasIgnoradas },
    'geração automática concluída',
  );

  return { modelosProcessados: modelos.length, tarefasGeradas, tarefasIgnoradas };
}
