'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Botao } from '@contabilpro/ui';

import {
  calcularSha256,
  enviarArquivoParaUrl,
  obterUrlDownloadVersao,
  presignarUpload,
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

  if (consulta.isLoading) return <p className="text-muted-foreground">Carregando...</p>;
  if (consulta.isError || !consulta.data) {
    return <p className="text-destructive">Documento não encontrado.</p>;
  }

  const doc = consulta.data;

  async function enviarNovaVersao(evento: React.FormEvent) {
    evento.preventDefault();
    if (!arquivoVersao) return;
    setErro(null);
    setEnviando(true);
    try {
      const hash = await calcularSha256(arquivoVersao);
      const presign = await presignarUpload({
        nome: arquivoVersao.name,
        mimeType: arquivoVersao.type || 'application/octet-stream',
        tamanhoBytes: arquivoVersao.size,
      });
      await enviarArquivoParaUrl(presign.url, arquivoVersao);
      await criarVersao.mutateAsync({
        mimeType: arquivoVersao.type || 'application/octet-stream',
        tamanhoBytes: arquivoVersao.size,
        hashSha256: hash,
        chaveStorage: presign.chave,
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
      <div className="text-sm">
        <Link href="/painel/documentos" className="text-muted-foreground hover:underline">
          ← Voltar para documentos
        </Link>
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{doc.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {doc.mimeType} · {formatarBytes(doc.tamanhoBytes)} · v{doc.versaoAtual}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enviado em {formatarData(doc.criadoEm)}
          </p>
        </div>
        <a
          href={doc.urlDownload}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Baixar atual
        </a>
      </header>

      <section className="grid gap-3 rounded-lg border bg-card p-4 text-sm sm:grid-cols-2">
        <Linha rotulo="Categoria" valor={doc.categoria?.nome} />
        <Linha rotulo="Empresa" valor={doc.empresa?.razaoSocial} />
        <Linha rotulo="Status" valor={doc.status} />
        <Linha rotulo="Hash SHA-256" valor={<code className="text-xs">{doc.hashSha256}</code>} />
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Versões</h2>
        <ul className="divide-y">
          {doc.versoes.length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">
              Apenas a versão atual. Envie um arquivo abaixo para criar uma nova versão.
            </li>
          )}
          {doc.versoes.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium">v{v.versao}</div>
                <div className="text-xs text-muted-foreground">
                  {formatarBytes(v.tamanhoBytes)} · {formatarData(v.criadoEm)}
                </div>
                {v.notas && <div className="text-xs italic text-muted-foreground">{v.notas}</div>}
              </div>
              <button
                type="button"
                onClick={() => baixarVersao(v.id)}
                className="text-xs text-primary hover:underline"
              >
                Baixar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Enviar nova versão</h2>
        <form onSubmit={enviarNovaVersao} className="space-y-3">
          <input
            type="file"
            onChange={(e) => setArquivoVersao(e.target.files?.[0] ?? null)}
            disabled={enviando}
            className="block w-full text-sm"
          />
          <textarea
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
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
      <div className="text-muted-foreground">{rotulo}</div>
      <div>{valor ?? '—'}</div>
    </div>
  );
}
