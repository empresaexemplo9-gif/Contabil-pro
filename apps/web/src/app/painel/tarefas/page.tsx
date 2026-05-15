'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Botao } from '@contabilpro/ui';
import type { StatusTarefa } from '@contabilpro/contracts';

import {
  useAtualizarTarefa,
  useMetricasTarefas,
  useTarefas,
  type TarefaListada,
} from '@/lib/hooks-tarefas';
import { formatarData, rotuloPrioridade, rotuloStatusTarefa } from '@/lib/formatadores';

const STATUS_PERMITIDOS: StatusTarefa[] = [
  'PENDENTE',
  'EM_ANDAMENTO',
  'CONCLUIDA',
  'ATRASADA',
  'CANCELADA',
];

const COR_PRIORIDADE: Record<string, string> = {
  BAIXA: 'bg-muted text-muted-foreground',
  MEDIA: 'bg-primary/10 text-primary',
  ALTA: 'bg-accent/15 text-accent',
  URGENTE: 'bg-destructive/10 text-destructive',
};

const COR_STATUS: Record<string, string> = {
  PENDENTE: 'bg-muted text-muted-foreground border-border',
  EM_ANDAMENTO: 'bg-primary/10 text-primary border-primary/20',
  CONCLUIDA: 'bg-secondary/15 text-secondary border-secondary/20',
  ATRASADA: 'bg-destructive/10 text-destructive border-destructive/20',
  CANCELADA: 'bg-muted text-muted-foreground border-border',
};

export default function PaginaTarefas() {
  const [termo, setTermo] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [status, setStatus] = useState<StatusTarefa | ''>('');
  const [vencendoEm, setVencendoEm] = useState<number | ''>('');

  const metricas = useMetricasTarefas();
  const consulta = useTarefas({
    termo: termoBusca || undefined,
    status: status || undefined,
    vencendoEm: vencendoEm || undefined,
    tamanho: 50,
    pagina: 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Tarefas</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de tarefas e prazos do escritório.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CartaoMetrica titulo="Pendentes" valor={metricas.data?.pendentes} />
        <CartaoMetrica titulo="Em andamento" valor={metricas.data?.emAndamento} />
        <CartaoMetrica titulo="Atrasadas" valor={metricas.data?.atrasadas} acento="destructive" />
        <CartaoMetrica titulo="Vencem hoje" valor={metricas.data?.vencemHoje} acento="warning" />
        <CartaoMetrica titulo="Próximos 7 dias" valor={metricas.data?.proximos7Dias} />
        <CartaoMetrica
          titulo="Concluídas (mês)"
          valor={metricas.data?.concluidasMes}
          acento="success"
        />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTermoBusca(termo.trim());
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="min-w-64 flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusTarefa | '')}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="">Todos</option>
            {STATUS_PERMITIDOS.map((s) => (
              <option key={s} value={s}>
                {rotuloStatusTarefa(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Vencendo em (dias)
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={vencendoEm}
            onChange={(e) => setVencendoEm(e.target.value ? Number(e.target.value) : '')}
            className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <Botao type="submit" variante="contorno">
          Aplicar
        </Botao>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tarefa</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {consulta.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {consulta.data?.itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma tarefa encontrada com esses filtros.
                </td>
              </tr>
            )}
            {consulta.data?.itens.map((tarefa) => (
              <LinhaTarefa key={tarefa.id} tarefa={tarefa} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinhaTarefa({ tarefa }: { tarefa: TarefaListada }) {
  const atualizar = useAtualizarTarefa();
  return (
    <tr className="border-t border-border transition hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="font-medium">{tarefa.titulo}</div>
        {tarefa.modelo && (
          <div className="text-xs text-muted-foreground">{tarefa.modelo.nome}</div>
        )}
      </td>
      <td className="px-4 py-3">{tarefa.empresa?.razaoSocial ?? '—'}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            COR_PRIORIDADE[tarefa.prioridade] ?? ''
          }`}
        >
          {rotuloPrioridade(tarefa.prioridade)}
        </span>
      </td>
      <td className="px-4 py-3">{formatarData(tarefa.dataVencimento)}</td>
      <td className="px-4 py-3 text-muted-foreground">{tarefa.responsavel?.nome ?? '—'}</td>
      <td className="px-4 py-3">
        <select
          value={tarefa.status}
          onChange={(e) =>
            atualizar.mutate({
              id: tarefa.id,
              dados: { status: e.target.value as StatusTarefa },
            })
          }
          className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring/20 ${
            COR_STATUS[tarefa.status] ?? ''
          }`}
        >
          {STATUS_PERMITIDOS.map((s) => (
            <option key={s} value={s}>
              {rotuloStatusTarefa(s)}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function CartaoMetrica({
  titulo,
  valor,
  acento,
}: {
  titulo: string;
  valor?: number;
  acento?: 'destructive' | 'warning' | 'success';
}) {
  const corValor =
    acento === 'destructive'
      ? 'text-destructive'
      : acento === 'warning'
        ? 'text-accent'
        : acento === 'success'
          ? 'text-secondary'
          : 'text-foreground';
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-card-soft">
      <div className="text-xs text-muted-foreground">{titulo}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${corValor}`}>
        {valor ?? '—'}
      </div>
    </div>
  );
}
