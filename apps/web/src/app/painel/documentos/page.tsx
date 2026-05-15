'use client';

import { ChevronLeft, ChevronRight, FileText, Search, Upload } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Botao } from '@contabilpro/ui';

import {
  useArquivarDocumento,
  useCategoriasDocumento,
  useDocumentos,
  useRestaurarDocumento,
} from '@/lib/hooks-documentos';
import { formatarBytes, formatarData } from '@/lib/formatadores';

const TAMANHO_PAGINA = 20;

export default function PaginaDocumentos() {
  const [pagina, setPagina] = useState(1);
  const [termo, setTermo] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [status, setStatus] = useState<'ATIVO' | 'ARQUIVADO'>('ATIVO');

  const categorias = useCategoriasDocumento();
  const consulta = useDocumentos({
    pagina,
    tamanho: TAMANHO_PAGINA,
    termo: termoBusca || undefined,
    categoriaId: categoriaId || undefined,
    status,
  });
  const arquivar = useArquivarDocumento();
  const restaurar = useRestaurarDocumento();

  const totalPaginas = consulta.data
    ? Math.max(1, Math.ceil(consulta.data.total / TAMANHO_PAGINA))
    : 1;

  function aoBuscar(evento: React.FormEvent) {
    evento.preventDefault();
    setPagina(1);
    setTermoBusca(termo.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Repositório versionado de documentos do escritório.
          </p>
        </div>
        <Link
          href="/painel/documentos/novo"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card-soft transition hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Enviar documento
        </Link>
      </div>

      <form onSubmit={aoBuscar} className="flex flex-wrap items-end gap-2">
        <div className="min-w-64 flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Buscar por nome
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
            Categoria
          </label>
          <select
            value={categoriaId}
            onChange={(e) => {
              setPagina(1);
              setCategoriaId(e.target.value);
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="">Todas</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setPagina(1);
              setStatus(e.target.value as 'ATIVO' | 'ARQUIVADO');
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="ATIVO">Ativos</option>
            <option value="ARQUIVADO">Arquivados</option>
          </select>
        </div>
        <Botao type="submit" variante="contorno">
          Buscar
        </Botao>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Tamanho</th>
              <th className="px-4 py-3 font-medium">Versão</th>
              <th className="px-4 py-3 font-medium">Enviado em</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {consulta.isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {consulta.data?.itens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum documento encontrado.
                    </p>
                    <Link
                      href="/painel/documentos/novo"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Enviar o primeiro documento
                    </Link>
                  </div>
                </td>
              </tr>
            )}
            {consulta.data?.itens.map((doc) => (
              <tr
                key={doc.id}
                className="border-t border-border transition hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/painel/documentos/${doc.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {doc.nome}
                  </Link>
                  <div className="text-xs text-muted-foreground">{doc.mimeType}</div>
                </td>
                <td className="px-4 py-3">{doc.categoria?.nome ?? '—'}</td>
                <td className="px-4 py-3">{doc.empresa?.razaoSocial ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{formatarBytes(doc.tamanhoBytes)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    v{doc.versaoAtual}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatarData(doc.criadoEm)}
                </td>
                <td className="px-4 py-3 text-right">
                  {doc.status === 'ATIVO' ? (
                    <button
                      type="button"
                      onClick={() => arquivar.mutate(doc.id)}
                      className="text-xs font-medium text-destructive hover:underline"
                    >
                      Arquivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => restaurar.mutate(doc.id)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Restaurar
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
            {consulta.data.total} documento{consulta.data.total === 1 ? '' : 's'}
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
