'use client';

import {
  Building2,
  ClipboardList,
  FileSignature,
  FileText,
  ListChecks,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
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

// Paleta DRAP — navy/verde/dourado
const NAVY = 'hsl(222 75% 25%)';
const VERDE = 'hsl(139 36% 35%)';
const DOURADO = 'hsl(38 55% 48%)';
const VERMELHO = 'hsl(0 65% 50%)';
const CINZA = 'hsl(240 6% 55%)';

const CORES_STATUS: Record<string, string> = {
  PENDENTE: CINZA,
  EM_ANDAMENTO: NAVY,
  CONCLUIDA: VERDE,
  ATRASADA: VERMELHO,
  CANCELADA: 'hsl(240 6% 70%)',
};

const CORES_CANAL: Record<string, string> = {
  PORTAL: NAVY,
  EMAIL: DOURADO,
  WHATSAPP: VERDE,
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
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do escritório nos últimos 30 dias.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <CartaoIndicador
          titulo="Empresas ativas"
          valor={resumo.data?.empresasAtivas}
          icone={<Building2 className="h-4 w-4" />}
        />
        <CartaoIndicador
          titulo="Total empresas"
          valor={resumo.data?.totalEmpresas}
          icone={<Building2 className="h-4 w-4" />}
        />
        <CartaoIndicador
          titulo="Tarefas pendentes"
          valor={resumo.data?.tarefasPendentes}
          icone={<ListChecks className="h-4 w-4" />}
        />
        <CartaoIndicador
          titulo="Tarefas atrasadas"
          valor={resumo.data?.tarefasAtrasadas}
          acento="destructive"
          icone={<ClipboardList className="h-4 w-4" />}
        />
        <CartaoIndicador
          titulo="Vencem em 7 dias"
          valor={resumo.data?.tarefasVencendoEm7Dias}
          acento="warning"
          icone={<TrendingUp className="h-4 w-4" />}
        />
        <CartaoIndicador
          titulo="Conversas abertas"
          valor={resumo.data?.conversasAbertas}
          icone={<MessageSquare className="h-4 w-4" />}
        />
        <CartaoIndicador
          titulo="Docs no mês"
          valor={resumo.data?.documentosNoMes}
          icone={<FileText className="h-4 w-4" />}
        />
        <CartaoIndicador
          titulo="Assinaturas pendentes"
          valor={resumo.data?.assinaturasPendentes}
          acento="warning"
          icone={<FileSignature className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CaixaGrafico titulo="Atividade (últimos 30 dias)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dadosAtividade} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="tarefas"
                name="Tarefas concluídas"
                stroke={VERDE}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="documentos"
                name="Documentos enviados"
                stroke={NAVY}
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
                  <Cell key={d.chave} fill={CORES_STATUS[d.chave] ?? CINZA} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CaixaGrafico>

        <CaixaGrafico titulo="Empresas ativas por regime">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosRegime} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="nome"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                interval={0}
                angle={-15}
                dy={10}
              />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="valor" name="Empresas" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CaixaGrafico>

        <CaixaGrafico titulo="Conversas por canal">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosCanal} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="valor" name="Conversas" radius={[4, 4, 0, 0]}>
                {dadosCanal.map((d) => (
                  <Cell key={d.chave} fill={CORES_CANAL[d.chave] ?? CINZA} />
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
  icone,
}: {
  titulo: string;
  valor?: number;
  acento?: 'destructive' | 'warning' | 'success';
  icone?: React.ReactNode;
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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icone}
        <span className="truncate">{titulo}</span>
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${corValor}`}>
        {valor ?? '—'}
      </div>
    </div>
  );
}

function CaixaGrafico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card-soft">
      <h2 className="mb-3 text-sm font-medium text-foreground">{titulo}</h2>
      {children}
    </div>
  );
}
