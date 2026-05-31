import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';
import { z } from 'zod';

import { calcularVencimento, proximoMes } from './_lib/vencimento';

export const PayloadGeradorTarefas = z
  .object({
    // Permite override pra testes; em produção o cron dispara sem payload
    // e o job calcula o próximo mês automaticamente.
    mes: z.number().int().min(1).max(12).optional(),
    ano: z.number().int().min(2020).max(2100).optional(),
  })
  .optional();
export type PayloadGeradorTarefas = z.infer<typeof PayloadGeradorTarefas>;

/**
 * Cron mensal: para cada ModeloObrigacao ativo, gera tarefas para o
 * próximo mês em cada empresa-cliente cujo regime tributário esteja
 * contemplado. Idempotente: verifica por (modeloId, empresaId, dataVencimento).
 */
export async function gerarTarefasAutomaticas(payloadBruto?: unknown): Promise<{
  modelosProcessados: number;
  tarefasGeradas: number;
  tarefasIgnoradas: number;
}> {
  const payload = PayloadGeradorTarefas.parse(payloadBruto ?? {});
  const { mes, ano } =
    payload?.mes && payload?.ano ? { mes: payload.mes, ano: payload.ano } : proximoMes();

  const log = logger.child({ mes, ano });
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
