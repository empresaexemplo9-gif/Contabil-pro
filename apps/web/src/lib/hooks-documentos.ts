'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  BuscarDocumentos,
  CategoriaDocumento,
  CriarCategoriaDocumentoEntrada,
  CriarDocumentoEntrada,
  CriarVersaoDocumentoEntrada,
  Documento,
  VersaoDocumento,
} from '@contabilpro/contracts';

import { clienteApi } from './cliente-api';

interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
}

function montarQuery(filtros: Partial<BuscarDocumentos>): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, String(valor));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export type DocumentoListado = Documento & {
  categoria: { id: string; nome: string } | null;
  empresa: { id: string; razaoSocial: string } | null;
};

export type DocumentoDetalhado = Documento & {
  categoria: { id: string; nome: string } | null;
  empresa: { id: string; razaoSocial: string } | null;
  versoes: VersaoDocumento[];
  urlDownload: string;
};

export function useDocumentos(filtros: Partial<BuscarDocumentos>) {
  return useQuery({
    queryKey: ['documentos', filtros],
    queryFn: () =>
      clienteApi.get<RespostaPaginada<DocumentoListado>>(`/documentos${montarQuery(filtros)}`),
  });
}

export function useDocumento(id: string | undefined) {
  return useQuery({
    queryKey: ['documento', id],
    queryFn: () => clienteApi.get<DocumentoDetalhado>(`/documentos/${id}`),
    enabled: Boolean(id),
  });
}

export function useCategoriasDocumento() {
  return useQuery({
    queryKey: ['categorias-documento'],
    queryFn: () => clienteApi.get<CategoriaDocumento[]>('/documentos/categorias'),
  });
}

export function useCriarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarCategoriaDocumentoEntrada) =>
      clienteApi.post<CategoriaDocumento>('/documentos/categorias', dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias-documento'] }),
  });
}

export function useRemoverCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.delete<{ ok: true }>(`/documentos/categorias/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias-documento'] }),
  });
}

interface RespostaUpload {
  url: string;
  chave: string;
}

/**
 * Envia arquivo via multipart pra API, que faz upload no Vercel Blob.
 * Retorna a URL pública do blob e a chave lógica (usada como id interno
 * no `chaveStorage` ao registrar o documento).
 *
 * Limite atual: 4.5 MB por requisição (cap da Vercel function). Pra
 * arquivos maiores, vai precisar Vercel Pro + streaming.
 */
export async function enviarDocumento(
  arquivo: File,
  aoProgresso?: (porcento: number) => void,
): Promise<RespostaUpload> {
  const urlApi = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token-acesso') : null;

  const formData = new FormData();
  formData.append('arquivo', arquivo, arquivo.name);

  return new Promise<RespostaUpload>((resolver, rejeitar) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${urlApi}/api/v1/documentos/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (evento) => {
      if (aoProgresso && evento.lengthComputable) {
        aoProgresso(Math.round((evento.loaded / evento.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolver(JSON.parse(xhr.responseText) as RespostaUpload);
        } catch {
          rejeitar(new Error('Resposta inválida do servidor'));
        }
      } else {
        rejeitar(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => rejeitar(new Error('falha de rede no upload'));
    xhr.send(formData);
  });
}

export async function calcularSha256(arquivo: File): Promise<string> {
  const buf = await arquivo.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useRegistrarDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarDocumentoEntrada) =>
      clienteApi.post<Documento>('/documentos', dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }),
  });
}

export function useCriarVersao(documentoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarVersaoDocumentoEntrada) =>
      clienteApi.post<VersaoDocumento>(`/documentos/${documentoId}/versoes`, dados),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['documento', documentoId] });
      void qc.invalidateQueries({ queryKey: ['documentos'] });
    },
  });
}

export function useArquivarDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clienteApi.delete<{ ok: true }>(`/documentos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }),
  });
}

export function useRestaurarDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.post<{ ok: true }>(`/documentos/${id}/restaurar`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }),
  });
}

export async function obterUrlDownload(id: string): Promise<string> {
  const r = await clienteApi.get<{ url: string }>(`/documentos/${id}/download`);
  return r.url;
}

export async function obterUrlDownloadVersao(id: string, versaoId: string): Promise<string> {
  const r = await clienteApi.get<{ url: string }>(`/documentos/${id}/versoes/${versaoId}/download`);
  return r.url;
}
