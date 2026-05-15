'use client';

import { Building2, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Botao } from '@contabilpro/ui';

import { useEmpresas, useInativarEmpresa } from '@/lib/hooks-empresas';
import { formatarCnpj, formatarData, rotuloRegime, rotuloStatus } from '@/lib/formatadores';

const TAMANHO_PAGINA = 20;

export default function PaginaEmpresas() {
  const [pagina, setPagina] = useState(1);
  const [termo, setTermo] = useState('');
  const [termoBusca, setTermoBusca] = useState('');

  const consulta = useEmpresas({
    pagina,
    tamanho: TAMANHO_PAGINA,
    termo: termoBusca || undefined,
  });
  const inativar = useInativarEmpresa();

  const totalPaginas = consulta.data ? Math.max(1, Math.ceil(consulta.data.total / TAMANHO_PAGINA)) : 1;

  function aoBuscar(evento: React.FormEvent) {
    evento.preventDefault();
    setPagina(1);
    setTermoBusca(termo.trim());
  }

  async function aoInativar(id: string, razao: string) {
    if (!confirm(`Inativar a empresa "${razao}"? Você pode reativá-la depois.`)) return;
    await inativar.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de empresas atendidas pelo escritório.
          </p>
        </div>
        <Link
          href="/painel/empresas/nova"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card-soft transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova empresa
        </Link>
      </div>

      <form onSubmit={aoBuscar} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por razão social, fantasia ou CNPJ"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <Botao type="submit" variante="contorno">
          Buscar
        </Botao>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Razão social</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">Regime</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3"></th>
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
            {consulta.isError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-destructive">
                  Erro ao carregar empresas.
                </td>
              </tr>
            )}
            {consulta.data?.itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma empresa encontrada.
                    </p>
                    <Link
                      href="/painel/empresas/nova"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Cadastrar a primeira empresa
                    </Link>
                  </div>
                </td>
              </tr>
            )}
            {consulta.data?.itens.map((empresa) => (
              <tr
                key={empresa.id}
                className="border-t border-border transition hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/painel/empresas/${empresa.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {empresa.razaoSocial}
                  </Link>
                  {empresa.nomeFantasia && (
                    <div className="text-xs text-muted-foreground">{empresa.nomeFantasia}</div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {formatarCnpj(empresa.cnpj)}
                </td>
                <td className="px-4 py-3">{rotuloRegime(empresa.regime)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      empresa.status === 'ATIVA'
                        ? 'inline-flex items-center rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary'
                        : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                    }
                  >
                    {rotuloStatus(empresa.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatarData(empresa.criadoEm)}
                </td>
                <td className="px-4 py-3 text-right">
                  {empresa.status === 'ATIVA' && (
                    <button
                      type="button"
                      onClick={() => aoInativar(empresa.id, empresa.razaoSocial)}
                      className="text-xs font-medium text-destructive hover:underline"
                    >
                      Inativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {consulta.data && consulta.data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {consulta.data.total} empresa{consulta.data.total === 1 ? '' : 's'} no total
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
