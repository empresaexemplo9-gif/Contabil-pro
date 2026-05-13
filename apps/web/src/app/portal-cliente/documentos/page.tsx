'use client';

import { useState } from 'react';

import {
  baixarDocumentoPortal,
  usePortalDocumentos,
  type DocumentoPortal,
} from '@/lib/hooks-portal-cliente';
import { formatarData } from '@/lib/formatadores';

export default function PaginaPortalDocumentos() {
  const [termo, setTermo] = useState('');
  const { data, isLoading, error } = usePortalDocumentos(termo);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Arquivos compartilhados pelo seu escritório.
          </p>
        </div>
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por nome…"
          className="w-64 rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Falha ao carregar documentos.</p>}

      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nenhum documento encontrado.
        </div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Versão</th>
                <th className="px-3 py-2">Enviado em</th>
                <th className="px-3 py-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {data.map((doc) => (
                <LinhaDocumento key={doc.id} documento={doc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LinhaDocumento({ documento }: { documento: DocumentoPortal }) {
  const [baixando, setBaixando] = useState(false);

  async function baixar() {
    setBaixando(true);
    try {
      const url = await baixarDocumentoPortal(documento.id);
      window.open(url, '_blank', 'noopener');
    } finally {
      setBaixando(false);
    }
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-2">
        <div className="font-medium">{documento.nome}</div>
        <div className="text-xs text-muted-foreground">
          {formatarTamanho(documento.tamanhoBytes)} · {documento.mimeType}
        </div>
      </td>
      <td className="px-3 py-2 text-muted-foreground">
        {documento.categoria?.nome ?? '—'}
      </td>
      <td className="px-3 py-2">v{documento.versaoAtual}</td>
      <td className="px-3 py-2 text-muted-foreground">{formatarData(documento.criadoEm)}</td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={baixar}
          disabled={baixando}
          className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
        >
          {baixando ? 'Abrindo…' : 'Baixar'}
        </button>
      </td>
    </tr>
  );
}

function formatarTamanho(bytes: string): string {
  const n = Number(bytes);
  if (!Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
