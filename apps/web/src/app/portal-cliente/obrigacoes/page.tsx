'use client';

import { useMemo } from 'react';

import { usePortalTarefas, type TarefaPortal } from '@/lib/hooks-portal-cliente';
import { formatarData, rotuloPrioridade, rotuloStatusTarefa } from '@/lib/formatadores';

const COR_STATUS: Record<string, string> = {
  PENDENTE: 'bg-slate-100 text-slate-700',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  CONCLUIDA: 'bg-emerald-100 text-emerald-700',
  ATRASADA: 'bg-destructive/10 text-destructive',
  CANCELADA: 'bg-muted text-muted-foreground',
};

const COR_PRIORIDADE: Record<string, string> = {
  BAIXA: 'text-muted-foreground',
  MEDIA: 'text-blue-600',
  ALTA: 'text-amber-600',
  URGENTE: 'text-destructive',
};

export default function PaginaPortalObrigacoes() {
  const { data, isLoading, error } = usePortalTarefas();

  const grupos = useMemo(() => {
    if (!data) return null;
    const abertas: TarefaPortal[] = [];
    const concluidas: TarefaPortal[] = [];
    const canceladas: TarefaPortal[] = [];
    for (const t of data) {
      if (t.status === 'CONCLUIDA') concluidas.push(t);
      else if (t.status === 'CANCELADA') canceladas.push(t);
      else abertas.push(t);
    }
    return { abertas, concluidas, canceladas };
  }, [data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Obrigações</h1>
        <p className="text-sm text-muted-foreground">
          Tarefas atribuídas pelo seu escritório com prazos e prioridades.
        </p>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Falha ao carregar.</p>}

      {grupos && (
        <>
          <Secao titulo={`Em aberto (${grupos.abertas.length})`} tarefas={grupos.abertas} />
          {grupos.concluidas.length > 0 && (
            <Secao
              titulo={`Concluídas (${grupos.concluidas.length})`}
              tarefas={grupos.concluidas}
            />
          )}
          {grupos.canceladas.length > 0 && (
            <Secao
              titulo={`Canceladas (${grupos.canceladas.length})`}
              tarefas={grupos.canceladas}
            />
          )}
        </>
      )}
    </div>
  );
}

function Secao({ titulo, tarefas }: { titulo: string; tarefas: TarefaPortal[] }) {
  if (tarefas.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Nenhuma obrigação nesta categoria.
      </section>
    );
  }
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{titulo}</h2>
      <ul className="space-y-2">
        {tarefas.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${COR_STATUS[t.status] ?? 'bg-muted'}`}
                >
                  {rotuloStatusTarefa(t.status)}
                </span>
                <span
                  className={`text-xs font-medium ${COR_PRIORIDADE[t.prioridade] ?? ''}`}
                >
                  {rotuloPrioridade(t.prioridade)}
                </span>
              </div>
              <div className="mt-1 font-medium">{t.titulo}</div>
              {t.descricao && (
                <p className="mt-0.5 text-sm text-muted-foreground">{t.descricao}</p>
              )}
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Vence em</div>
              <div className="font-medium text-foreground">{formatarData(t.dataVencimento)}</div>
              {t.concluidaEm && (
                <div className="mt-1">Concluída em {formatarData(t.concluidaEm)}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
