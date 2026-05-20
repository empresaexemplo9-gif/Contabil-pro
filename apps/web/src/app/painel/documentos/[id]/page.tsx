'use client';

import { ArrowLeft, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Botao } from '@contabilpro/ui';

import {
  calcularSha256,
  enviarDocumento,
  obterUrlDownloadVersao,
  useCriarVersao,
  useDocumento,
} from '@/lib/hooks-documentos';
import { formatarBytes, formatarData } from '@/lib/formatadores';

export default function PaginaDocumento() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const consulta = useDocumento(id);
  const criarVersao = useCriarVersao(id);

  const [arquivoVersao, setArquivoVersao] = useState<File | null>(null);
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (consulta.isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (consulta.isError || !consulta.data) {
    return <p className="text-sm text-destructive">Documento não encontrado.</p>;
  }

  const doc = consulta.data;

  async function enviarNovaVersao(evento: React.FormEvent) {
    evento.preventDefault();
    if (!arquivoVersao) return;
    setErro(null);
    setEnviando(true);
    try {
      const hash = await calcularSha256(arquivoVersao);
      const upload = await enviarDocumento(arquivoVersao);
      await criarVersao.mutateAsync({
        mimeType: arquivoVersao.type || 'application/octet-stream',
        tamanhoBytes: arquivoVersao.size,
        hashSha256: hash,
        chaveStorage: upload.chave,
        notas: notas || undefined,
      });
      setArquivoVersao(null);
      setNotas('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao enviar versão');
    } finally {
      setEnviando(false);
    }
  }

  async function baixarVersao(versaoId: string) {
    const url = await obterUrlDownloadVersao(id, versaoId);
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      <Link
        href="/painel/documentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para documentos
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{doc.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {doc.mimeType} · {formatarBytes(doc.tamanhoBytes)} ·{' '}
              <span className="inline-flex items-center rounded-md bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                v{doc.versaoAtual}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enviado em {formatarData(doc.criadoEm)}
            </p>
          </div>
        </div>
        <a
          href={doc.urlDownload}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card-soft transition hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          Baixar atual
        </a>
      </header>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 text-sm shadow-card-soft sm:grid-cols-2">
        <Linha rotulo="Categoria" valor={doc.categoria?.nome} />
        <Linha rotulo="Empresa" valor={doc.empresa?.razaoSocial} />
        <Linha rotulo="Status" valor={doc.status} />
        <Linha
          rotulo="Hash SHA-256"
          valor={
            <code className="break-all font-mono text-xs text-muted-foreground">
              {doc.hashSha256}
            </code>
          }
        />
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-card-soft">
        <h2 className="text-lg font-medium">Versões</h2>
        <ul className="divide-y divide-border">
          {doc.versoes.length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">
              Apenas a versão atual. Envie um arquivo abaixo para criar uma nova versão.
            </li>
          )}
          {doc.versoes.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="inline-flex items-center rounded-md bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                    v{v.versao}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatarBytes(v.tamanhoBytes)} · {formatarData(v.criadoEm)}
                </div>
                {v.notas && (
                  <div className="mt-0.5 text-xs italic text-muted-foreground">{v.notas}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => baixarVersao(v.id)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-card-soft">
        <h2 className="text-lg font-medium">Enviar nova versão</h2>
        <form onSubmit={enviarNovaVersao} className="space-y-3">
          <input
            type="file"
            onChange={(e) => setArquivoVersao(e.target.files?.[0] ?? null)}
            disabled={enviando}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
          />
          <textarea
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {erro && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </p>
          )}
          <div className="flex justify-end">
            <Botao type="submit" disabled={!arquivoVersao || enviando}>
              {enviando ? 'Enviando...' : 'Adicionar versão'}
            </Botao>
          </div>
        </form>
      </section>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</div>
      <div className="mt-0.5">{valor ?? '—'}</div>
    </div>
  );
}
