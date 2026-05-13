'use client';

import Link from 'next/link';

import { usePortalResumo } from '@/lib/hooks-portal-cliente';
import { formatarCnpj } from '@/lib/formatadores';

export default function PaginaPortalInicio() {
  const { data, isLoading, error } = usePortalResumo();

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (error || !data)
    return <p className="text-destructive">Não foi possível carregar seus dados.</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{data.empresa.razaoSocial}</h1>
        <p className="text-sm text-muted-foreground">
          CNPJ {formatarCnpj(data.empresa.cnpj)} · {data.empresa.regime.replace('_', ' ')}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cartao
          titulo="Documentos nos últimos 30 dias"
          valor={data.docsUltimos30Dias}
          href="/portal-cliente/documentos"
        />
        <Cartao
          titulo="Obrigações em aberto"
          valor={data.tarefasAbertas}
          href="/portal-cliente/obrigacoes"
        />
        <Cartao
          titulo="Vencem em 7 dias"
          valor={data.tarefasVencendoEm7Dias}
          href="/portal-cliente/obrigacoes"
          acento="warning"
        />
        <Cartao
          titulo="Assinaturas pendentes"
          valor={data.assinaturasPendentes}
          href="/portal-cliente/assinaturas"
          acento={data.assinaturasPendentes > 0 ? 'warning' : undefined}
        />
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Atalhos</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/portal-cliente/mensagens"
            className="rounded-md border p-3 hover:bg-accent"
          >
            <div className="font-medium">Falar com o escritório</div>
            <div className="text-xs text-muted-foreground">
              {data.conversasAbertas > 0
                ? `${data.conversasAbertas} conversa(s) em andamento`
                : 'Abra uma nova conversa'}
            </div>
          </Link>
          <Link
            href="/portal-cliente/documentos"
            className="rounded-md border p-3 hover:bg-accent"
          >
            <div className="font-medium">Cofre de documentos</div>
            <div className="text-xs text-muted-foreground">
              Acesse balancetes, declarações e comprovantes.
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Cartao({
  titulo,
  valor,
  href,
  acento,
}: {
  titulo: string;
  valor: number;
  href: string;
  acento?: 'warning' | 'destructive';
}) {
  const cor =
    acento === 'destructive'
      ? 'text-destructive'
      : acento === 'warning'
        ? 'text-amber-600'
        : '';
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="text-xs text-muted-foreground">{titulo}</div>
      <div className={`mt-1 text-3xl font-semibold ${cor}`}>{valor}</div>
    </Link>
  );
}
