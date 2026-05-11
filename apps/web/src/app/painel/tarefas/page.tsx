'use client';

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
  BAIXA: 'bg-slate-100 text-slate-700',
  MEDIA: 'bg-blue-100 text-blue-800',
  ALTA: 'bg-amber-100 text-amber-800',
  URGENTE: 'bg-red-100 text-red-800',
};

const COR_STATUS: Record<string, string> = {
  PENDENTE: 'bg-slate-100 text-slate-700',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
  CONCLUIDA: 'bg-emerald-100 text-emerald-800',
  ATRASADA: 'bg-red-100 text-red-800',
  CANCELADA: 'bg-muted text-muted-foreground',
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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tarefas</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CartaoMetrica titulo="Pendentes" valor={metricas.data?.pendentes} />
        <CartaoMetrica titulo="Em andamento" valor={metricas.data?.emAndamento} />
        <CartaoMetrica titulo="Atrasadas" valor={metricas.data?.atrasadas} acento="destructive" />
        <CartaoMetrica titulo="Vencem hoje" valor={metricas.data?.vencemHoje} acento="warning" />
        <CartaoMetrica titulo="Próximos 7 dias" valor={metricas.data?.proximos7Dias} />
        <CartaoMetrica titulo="Concluídas (mês)" valor={metricas.data?.concluidasMes} acento="success" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTermoBusca(termo.trim());
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="flex-1 min-w-64">
          <label className="block text-xs text-muted-foreground">Buscar</label>
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusTarefa | '')}
            className="rounded-md border bg-background px-3 py-2 text-sm"
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
          <label className="block text-xs text-muted-foreground">Vencendo em (dias)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={vencendoEm}
            onChange={(e) => setVencendoEm(e.target.value ? Number(e.target.value) : '')}
            className="w-32 rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <Botao type="submit" variante="contorno">
          Aplicar
        </Botao>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
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
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {consulta.data?.itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
    <tr className="border-t hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="font-medium">{tarefa.titulo}</div>
        {tarefa.modelo && (
          <div className="text-xs text-muted-foreground">{tarefa.modelo.nome}</div>
        )}
      </td>
      <td className="px-4 py-3">{tarefa.empresa?.razaoSocial ?? '—'}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${COR_PRIORIDADE[tarefa.prioridade] ?? ''}`}
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
          className={`rounded-md border px-2 py-1 text-xs ${COR_STATUS[tarefa.status] ?? ''}`}
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
        ? 'text-amber-600'
        : acento === 'success'
          ? 'text-emerald-600'
          : '';
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{titulo}</div>
      <div className={`mt-1 text-2xl font-semibold ${corValor}`}>{valor ?? '—'}</div>
    </div>
  );
}
