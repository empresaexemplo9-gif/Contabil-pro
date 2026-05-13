'use client';

import { useEscritorioAtual } from '@/lib/hooks-configuracoes';
import { formatarCnpj, formatarData } from '@/lib/formatadores';

const ROTULO_PLANO: Record<string, string> = {
  FREE: 'Gratuito',
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

const ROTULO_STATUS: Record<string, string> = {
  ATIVO: 'Ativo',
  SUSPENSO: 'Suspenso',
  CANCELADO: 'Cancelado',
};

export function AbaEscritorio() {
  const { data, isLoading, error } = useEscritorioAtual();

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (error || !data)
    return <p className="text-destructive">Não foi possível carregar o escritório.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Razão social" valor={data.razaoSocial} />
          <Campo rotulo="Nome fantasia" valor={data.nomeFantasia ?? '—'} />
          <Campo rotulo="CNPJ" valor={data.cnpj ? formatarCnpj(data.cnpj) : '—'} />
          <Campo rotulo="Slug (subdomínio)" valor={data.slug} mono />
          <Campo rotulo="Plano" valor={ROTULO_PLANO[data.plano] ?? data.plano} />
          <Campo rotulo="Status" valor={ROTULO_STATUS[data.status] ?? data.status} />
          <Campo rotulo="Criado em" valor={formatarData(data.criadoEm)} />
        </div>
      </div>

      <div className="rounded-lg border border-dashed bg-card/50 p-5 text-sm text-muted-foreground">
        A edição cadastral do escritório é restrita ao papel{' '}
        <span className="font-medium text-foreground">PROPRIETARIO</span> e por enquanto
        precisa ser feita via suporte. Em breve será editável aqui.
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</div>
      <div className={`mt-0.5 ${mono ? 'font-mono text-sm' : ''}`}>{valor}</div>
    </div>
  );
}
