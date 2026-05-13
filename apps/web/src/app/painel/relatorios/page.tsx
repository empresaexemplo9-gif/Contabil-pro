'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  useAtividade,
  useConversasPorCanal,
  useEmpresasPorRegime,
  useResumoDashboard,
  useTarefasPorStatus,
} from '@/lib/hooks-relatorios';
import { rotuloRegime, rotuloStatusTarefa } from '@/lib/formatadores';

const PERIODOS = [
  { dias: 7, rotulo: '7 dias' },
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
  { dias: 180, rotulo: '180 dias' },
] as const;

const CORES_STATUS: Record<string, string> = {
  PENDENTE: '#94a3b8',
  EM_ANDAMENTO: '#3b82f6',
  CONCLUIDA: '#10b981',
  ATRASADA: '#ef4444',
  CANCELADA: '#a8a29e',
};

const ROTULO_CANAL: Record<string, string> = {
  PORTAL: 'Portal',
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
};

const CORES_CANAL: Record<string, string> = {
  PORTAL: '#3b82f6',
  EMAIL: '#8b5cf6',
  WHATSAPP: '#10b981',
};

export default function PaginaRelatorios() {
  const [dias, setDias] = useState<number>(30);

  const resumo = useResumoDashboard();
  const porStatus = useTarefasPorStatus();
  const porRegime = useEmpresasPorRegime();
  const porCanal = useConversasPorCanal();
  const atividade = useAtividade(dias);

  const dadosStatus = useMemo(
    () =>
      (porStatus.data ?? []).map((d) => ({
        nome: rotuloStatusTarefa(d.status),
        chave: d.status,
        valor: d.total,
      })),
    [porStatus.data],
  );
  const dadosRegime = useMemo(
    () =>
      (porRegime.data ?? []).map((d) => ({
        nome: rotuloRegime(d.regime),
        chave: d.regime,
        valor: d.total,
      })),
    [porRegime.data],
  );
  const dadosCanal = useMemo(
    () =>
      (porCanal.data ?? []).map((d) => ({
        nome: ROTULO_CANAL[d.canal] ?? d.canal,
        chave: d.canal,
        valor: d.total,
      })),
    [porCanal.data],
  );
  const dadosAtividade = useMemo(() => atividade.data ?? [], [atividade.data]);

  const totaisAtividade = useMemo(() => {
    const tarefas = dadosAtividade.reduce((s, p) => s + p.tarefasConcluidas, 0);
    const documentos = dadosAtividade.reduce((s, p) => s + p.documentosEnviados, 0);
    return { tarefas, documentos };
  }, [dadosAtividade]);

  function baixarCsvAtividade() {
    const linhas = [
      ['Data', 'Tarefas concluídas', 'Documentos enviados'],
      ...dadosAtividade.map((p) => [p.data, String(p.tarefasConcluidas), String(p.documentosEnviados)]),
    ];
    baixarCsv(`atividade-${dias}d.csv`, linhas);
  }

  function baixarCsvResumo() {
    const linhas: string[][] = [['Indicador', 'Valor']];
    if (resumo.data) {
      for (const [chave, valor] of Object.entries(resumo.data)) {
        linhas.push([chave, String(valor)]);
      }
    }
    baixarCsv('resumo-indicadores.csv', linhas);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Análise detalhada de produtividade, obrigações e atendimento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                onClick={() => setDias(p.dias)}
                className={`px-3 py-1.5 text-sm transition ${
                  dias === p.dias
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-accent'
                }`}
              >
                {p.rotulo}
              </button>
            ))}
          </div>
          <button
            onClick={baixarCsvResumo}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Exportar resumo
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CartaoIndicador
          titulo="Tarefas concluídas no período"
          valor={totaisAtividade.tarefas}
          acento="success"
        />
        <CartaoIndicador
          titulo="Documentos enviados no período"
          valor={totaisAtividade.documentos}
        />
        <CartaoIndicador
          titulo="Tarefas atrasadas"
          valor={resumo.data?.tarefasAtrasadas}
          acento="destructive"
        />
        <CartaoIndicador
          titulo="Assinaturas pendentes"
          valor={resumo.data?.assinaturasPendentes}
          acento="warning"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CaixaGrafico
          titulo={`Atividade (últimos ${dias} dias)`}
          acao={
            <button
              onClick={baixarCsvAtividade}
              className="text-xs text-primary hover:underline"
              disabled={dadosAtividade.length === 0}
            >
              Exportar CSV
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={dadosAtividade.map((p) => ({
                data: p.data.slice(5),
                tarefas: p.tarefasConcluidas,
                documentos: p.documentosEnviados,
              }))}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="tarefas"
                name="Tarefas concluídas"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="documentos"
                name="Documentos enviados"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CaixaGrafico>

        <CaixaGrafico titulo="Tarefas por status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={dadosStatus}
                dataKey="valor"
                nameKey="nome"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {dadosStatus.map((d) => (
                  <Cell key={d.chave} fill={CORES_STATUS[d.chave] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CaixaGrafico>

        <CaixaGrafico titulo="Empresas ativas por regime tributário">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosRegime} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} angle={-15} dy={10} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="valor" name="Empresas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CaixaGrafico>

        <CaixaGrafico titulo="Conversas por canal">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosCanal} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="valor" name="Conversas" radius={[4, 4, 0, 0]}>
                {dadosCanal.map((d) => (
                  <Cell key={d.chave} fill={CORES_CANAL[d.chave] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CaixaGrafico>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Detalhamento por dia</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">Data</th>
                <th className="pb-2 pr-3">Tarefas concluídas</th>
                <th className="pb-2">Documentos enviados</th>
              </tr>
            </thead>
            <tbody>
              {dadosAtividade.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground">
                    Sem dados no período.
                  </td>
                </tr>
              )}
              {dadosAtividade
                .slice()
                .reverse()
                .map((p) => (
                  <tr key={p.data} className="border-b last:border-0">
                    <td className="py-1.5 pr-3">{p.data}</td>
                    <td className="py-1.5 pr-3">{p.tarefasConcluidas}</td>
                    <td className="py-1.5">{p.documentosEnviados}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CartaoIndicador({
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

function CaixaGrafico({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{titulo}</h2>
        {acao}
      </div>
      {children}
    </div>
  );
}

function baixarCsv(nome: string, linhas: string[][]): void {
  const csv = linhas
    .map((linha) =>
      linha
        .map((celula) => {
          const escapado = celula.replace(/"/g, '""');
          return /[",\n;]/.test(celula) ? `"${escapado}"` : escapado;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
