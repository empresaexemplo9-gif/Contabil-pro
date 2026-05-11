'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Botao } from '@contabilpro/ui';

import {
  calcularSha256,
  enviarArquivoParaUrl,
  presignarUpload,
  useCategoriasDocumento,
  useRegistrarDocumento,
} from '@/lib/hooks-documentos';
import { formatarBytes } from '@/lib/formatadores';

type Etapa = 'aguardando' | 'calculando' | 'presignando' | 'enviando' | 'registrando' | 'concluido';

const ROTULOS_ETAPA: Record<Etapa, string> = {
  aguardando: 'Selecione um arquivo',
  calculando: 'Calculando hash...',
  presignando: 'Solicitando URL de upload...',
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

      setEtapa('presignando');
      const presign = await presignarUpload({
        nome: arquivo.name,
        mimeType: arquivo.type || 'application/octet-stream',
        tamanhoBytes: arquivo.size,
      });

      setEtapa('enviando');
      await enviarArquivoParaUrl(presign.url, arquivo, setProgresso);

      setEtapa('registrando');
      const doc = await registrar.mutateAsync({
        nome: arquivo.name,
        mimeType: arquivo.type || 'application/octet-stream',
        tamanhoBytes: arquivo.size,
        hashSha256: hash,
        chaveStorage: presign.chave,
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="text-sm">
        <Link href="/painel/documentos" className="text-muted-foreground hover:underline">
          ← Voltar para documentos
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Enviar documento</h1>

      <form onSubmit={aoEnviar} className="space-y-4 rounded-lg border bg-card p-6">
        <label
          htmlFor="arquivo"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-background p-8 text-sm hover:bg-muted/30"
        >
          {arquivo ? (
            <>
              <span className="font-medium">{arquivo.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatarBytes(arquivo.size)} · {arquivo.type || 'tipo desconhecido'}
              </span>
            </>
          ) : (
            <>
              <span>Clique ou arraste um arquivo</span>
              <span className="text-xs text-muted-foreground">PDF, imagens ou planilhas até 500 MB</span>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Categoria</span>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              disabled={emProcesso}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
            <span className="mb-1 block text-muted-foreground">Empresa (ID)</span>
            <input
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              disabled={emProcesso}
              placeholder="opcional"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        {emProcesso && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">{ROTULOS_ETAPA[etapa]}</div>
            {etapa === 'enviando' && (
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            )}
          </div>
        )}

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <div className="flex justify-end">
          <Botao type="submit" disabled={!arquivo || emProcesso}>
            {emProcesso ? 'Enviando...' : 'Enviar'}
          </Botao>
        </div>
      </form>
    </div>
  );
}
