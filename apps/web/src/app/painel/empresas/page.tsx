'use client';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Empresas</h1>
        <Link
          href="/painel/empresas/nova"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          + Nova empresa
        </Link>
      </div>

      <form onSubmit={aoBuscar} className="flex gap-2">
        <input
          type="search"
          placeholder="Buscar por razão social, fantasia ou CNPJ"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Botao type="submit" variante="contorno">
          Buscar
        </Botao>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
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
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {consulta.isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-destructive">
                  Erro ao carregar empresas.
                </td>
              </tr>
            )}
            {consulta.data?.itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
            {consulta.data?.itens.map((empresa) => (
              <tr key={empresa.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/painel/empresas/${empresa.id}`}
                    className="font-medium hover:underline"
                  >
                    {empresa.razaoSocial}
                  </Link>
                  {empresa.nomeFantasia && (
                    <div className="text-xs text-muted-foreground">{empresa.nomeFantasia}</div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{formatarCnpj(empresa.cnpj)}</td>
                <td className="px-4 py-3">{rotuloRegime(empresa.regime)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      empresa.status === 'ATIVA'
                        ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800'
                        : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
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
                      className="text-xs text-destructive hover:underline"
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
            <Botao
              variante="contorno"
              tamanho="sm"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Botao>
            <span className="text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <Botao
              variante="contorno"
              tamanho="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
