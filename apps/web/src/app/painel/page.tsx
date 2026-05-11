'use client';

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

const ROTULO_CANAL: Record<string, string> = {
  PORTAL: 'Portal',
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
};

const CORES_STATUS: Record<string, string> = {
  PENDENTE: '#94a3b8',
  EM_ANDAMENTO: '#3b82f6',
  CONCLUIDA: '#10b981',
  ATRASADA: '#ef4444',
  CANCELADA: '#a8a29e',
};

const CORES_CANAL: Record<string, string> = {
  PORTAL: '#3b82f6',
  EMAIL: '#8b5cf6',
  WHATSAPP: '#10b981',
};

export default function PaginaDashboard() {
  const resumo = useResumoDashboard();
  const porStatus = useTarefasPorStatus();
  const porRegime = useEmpresasPorRegime();
  const porCanal = useConversasPorCanal();
  const atividade = useAtividade(30);

  const dadosStatus = (porStatus.data ?? []).map((d) => ({
    nome: rotuloStatusTarefa(d.status),
    chave: d.status,
    valor: d.total,
  }));
  const dadosRegime = (porRegime.data ?? []).map((d) => ({
    nome: rotuloRegime(d.regime),
    valor: d.total,
  }));
  const dadosCanal = (porCanal.data ?? []).map((d) => ({
    nome: ROTULO_CANAL[d.canal] ?? d.canal,
    chave: d.canal,
    valor: d.total,
  }));
  const dadosAtividade = (atividade.data ?? []).map((p) => ({
    data: p.data.slice(5),
    tarefas: p.tarefasConcluidas,
    documentos: p.documentosEnviados,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <CartaoIndicador titulo="Empresas ativas" valor={resumo.data?.empresasAtivas} />
        <CartaoIndicador titulo="Total empresas" valor={resumo.data?.totalEmpresas} />
        <CartaoIndicador titulo="Tarefas pendentes" valor={resumo.data?.tarefasPendentes} />
        <CartaoIndicador
          titulo="Tarefas atrasadas"
          valor={resumo.data?.tarefasAtrasadas}
          acento="destructive"
        />
        <CartaoIndicador
          titulo="Vencem em 7 dias"
          valor={resumo.data?.tarefasVencendoEm7Dias}
          acento="warning"
        />
        <CartaoIndicador titulo="Conversas abertas" valor={resumo.data?.conversasAbertas} />
        <CartaoIndicador titulo="Docs no mês" valor={resumo.data?.documentosNoMes} />
        <CartaoIndicador
          titulo="Assinaturas pendentes"
          valor={resumo.data?.assinaturasPendentes}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CaixaGrafico titulo="Atividade (últimos 30 dias)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dadosAtividade} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
          <ResponsiveContainer width="100%" height={260}>
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

        <CaixaGrafico titulo="Empresas ativas por regime">
          <ResponsiveContainer width="100%" height={260}>
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
          <ResponsiveContainer width="100%" height={260}>
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

function CaixaGrafico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{titulo}</h2>
      {children}
    </div>
  );
}
