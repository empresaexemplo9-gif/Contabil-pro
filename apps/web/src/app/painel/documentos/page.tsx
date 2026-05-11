'use client';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <Link
          href="/painel/documentos/novo"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          + Enviar documento
        </Link>
      </div>

      <form onSubmit={aoBuscar} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-64">
          <label className="block text-xs text-muted-foreground">Buscar por nome</label>
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => {
              setPagina(1);
              setCategoriaId(e.target.value);
            }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
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
          <label className="block text-xs text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setPagina(1);
              setStatus(e.target.value as 'ATIVO' | 'ARQUIVADO');
            }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ATIVO">Ativos</option>
            <option value="ARQUIVADO">Arquivados</option>
          </select>
        </div>
        <Botao type="submit" variante="contorno">
          Buscar
        </Botao>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
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
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {consulta.data?.itens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum documento encontrado.
                </td>
              </tr>
            )}
            {consulta.data?.itens.map((doc) => (
              <tr key={doc.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/painel/documentos/${doc.id}`}
                    className="font-medium hover:underline"
                  >
                    {doc.nome}
                  </Link>
                  <div className="text-xs text-muted-foreground">{doc.mimeType}</div>
                </td>
                <td className="px-4 py-3">{doc.categoria?.nome ?? '—'}</td>
                <td className="px-4 py-3">{doc.empresa?.razaoSocial ?? '—'}</td>
                <td className="px-4 py-3">{formatarBytes(doc.tamanhoBytes)}</td>
                <td className="px-4 py-3">v{doc.versaoAtual}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatarData(doc.criadoEm)}</td>
                <td className="px-4 py-3 text-right">
                  {doc.status === 'ATIVO' ? (
                    <button
                      type="button"
                      onClick={() => arquivar.mutate(doc.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Arquivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => restaurar.mutate(doc.id)}
                      className="text-xs text-primary hover:underline"
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
          <div className="text-muted-foreground">{consulta.data.total} documento(s)</div>
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
