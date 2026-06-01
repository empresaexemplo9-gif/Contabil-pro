import { prisma } from '@contabilpro/database';
import { logger } from '@contabilpro/logger';

import { publicarJob } from '../comum/fila/publicar';

/**
 * Cron diário: para cada tarefa pendente que vence em até 3 dias e tem
 * responsável atribuído, enfileira notificação in-app + e-mail. Evita
 * duplicar enviando no máximo uma notificação TAREFA_VENCENDO por
 * (tarefa, usuário) por dia.
 */
export async function lembrarObrigacoes(): Promise<{ enviadas: number }> {
  const agora = new Date();
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);

  const limite = new Date(agora);
  limite.setDate(limite.getDate() + 3);

  const tarefas = await prisma.tarefa.findMany({
    where: {
      status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'ATRASADA'] },
      dataVencimento: { lte: limite },
      responsavelId: { not: null },
    },
    include: {
      responsavel: { select: { id: true, email: true, nome: true } },
      empresa: { select: { razaoSocial: true } },
    },
  });

  let enviadas = 0;

  for (const tarefa of tarefas) {
    if (!tarefa.responsavel) continue;

    const jaNotificado = await prisma.notificacao.findFirst({
      where: {
        usuarioId: tarefa.responsavel.id,
        tipo: 'TAREFA_VENCENDO',
        criadoEm: { gte: inicioHoje },
        payload: { path: ['tarefaId'], equals: tarefa.id },
      },
      select: { id: true },
    });
    if (jaNotificado) continue;

    const venceEm = new Date(tarefa.dataVencimento);
    const diasParaVencer = Math.ceil(
      (venceEm.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
    );
    const empresaTexto = tarefa.empresa?.razaoSocial
      ? ` para ${tarefa.empresa.razaoSocial}`
      : '';
    const titulo =
      diasParaVencer < 0
        ? `Tarefa atrasada: ${tarefa.titulo}`
        : diasParaVencer === 0
          ? `Tarefa vence hoje: ${tarefa.titulo}`
          : `Tarefa vence em ${diasParaVencer} dia(s): ${tarefa.titulo}`;
    const corpo = `${tarefa.titulo}${empresaTexto} — vencimento em ${venceEm.toLocaleDateString('pt-BR')}.`;

    await publicarJob('enviar-notificacao', {
      escritorioId: tarefa.escritorioId,
      usuarioId: tarefa.responsavel.id,
      tipo: 'TAREFA_VENCENDO',
      canal: 'IN_APP',
      titulo,
      corpo,
      dados: { tarefaId: tarefa.id, dataVencimento: tarefa.dataVencimento.toISOString() },
    });

    if (tarefa.responsavel.email) {
      await publicarJob('enviar-email', {
        para: tarefa.responsavel.email,
        assunto: titulo,
        corpoHtml: `<p>${corpo}</p>`,
        corpoTexto: corpo,
      });
    }

    enviadas += 1;
  }

  logger.info({ candidatas: tarefas.length, enviadas }, 'lembretes processados');
  return { enviadas };
}
