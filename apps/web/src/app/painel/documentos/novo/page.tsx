'use client';

import { ArrowLeft, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Botao } from '@contabilpro/ui';

import {
  calcularSha256,
  enviarDocumento,
  useCategoriasDocumento,
  useRegistrarDocumento,
} from '@/lib/hooks-documentos';
import { formatarBytes } from '@/lib/formatadores';

type Etapa = 'aguardando' | 'calculando' | 'enviando' | 'registrando' | 'concluido';

const ROTULOS_ETAPA: Record<Etapa, string> = {
  aguardando: 'Selecione um arquivo',
  calculando: 'Calculando hash...',
  enviando: 'Enviando para o storage...',
  registrando: 'Registrando documento...',
  concluido: 'Concluído',
};

export default function PaginaNovoDocumento() {
  const roteador = useRouter();
  const categorias = useCategoriasDocumento();
  const registrar = useRegistrarDocumento();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [categoriaId, setCategoriaId] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [etapa, setEtapa] = useState<Etapa>('aguardando');
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!arquivo) return;
    setErro(null);
    try {
      setEtapa('calculando');
      const hash = await calcularSha256(arquivo);

      setEtapa('enviando');
      const upload = await enviarDocumento(arquivo, setProgresso);

      setEtapa('registrando');
      const doc = await registrar.mutateAsync({
        nome: arquivo.name,
        mimeType: arquivo.type || 'application/octet-stream',
        tamanhoBytes: arquivo.size,
        hashSha256: hash,
        chaveStorage: upload.chave,
        categoriaId: categoriaId || undefined,
        empresaId: empresaId || undefined,
      });

      setEtapa('concluido');
      roteador.push(`/painel/documentos/${doc.id}`);
    } catch (e) {
      setEtapa('aguardando');
      setErro(e instanceof Error ? e.message : 'Erro ao enviar documento');
    }
  }

  const emProcesso = etapa !== 'aguardando' && etapa !== 'concluido';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/painel/documentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para documentos
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Enviar documento</h1>
        <p className="text-sm text-muted-foreground">
          O arquivo é enviado direto ao storage com hash de integridade SHA-256.
        </p>
      </div>

      <form
        onSubmit={aoEnviar}
        className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-card-soft"
      >
        <label
          htmlFor="arquivo"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 p-10 text-sm transition hover:border-primary/40 hover:bg-muted/50"
        >
          {arquivo ? (
            <>
              <UploadCloud className="h-8 w-8 text-primary" />
              <span className="font-medium">{arquivo.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatarBytes(arquivo.size)} · {arquivo.type || 'tipo desconhecido'}
              </span>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
              <span className="font-medium">Clique ou arraste um arquivo</span>
              <span className="text-xs text-muted-foreground">
                PDF, imagens ou planilhas até 500 MB
              </span>
            </>
          )}
          <input
            id="arquivo"
            type="file"
            className="hidden"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            disabled={emProcesso}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Categoria
            </span>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              disabled={emProcesso}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="">(sem categoria)</option>
              {categorias.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Empresa (ID)
            </span>
            <input
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              disabled={emProcesso}
              placeholder="opcional"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </label>
        </div>

        {emProcesso && (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            <div className="text-sm text-muted-foreground">{ROTULOS_ETAPA[etapa]}</div>
            {etapa === 'enviando' && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            )}
          </div>
        )}

        {erro && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>
        )}

        <div className="flex justify-end">
          <Botao type="submit" disabled={!arquivo || emProcesso}>
            {emProcesso ? 'Enviando...' : 'Enviar'}
          </Botao>
        </div>
      </form>
    </div>
  );
}
