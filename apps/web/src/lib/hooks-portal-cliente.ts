'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clienteApi } from './cliente-api';

export interface ResumoPortal {
  empresa: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    cnpj: string;
    regime: string;
  };
  docsUltimos30Dias: number;
  tarefasAbertas: number;
  tarefasVencendoEm7Dias: number;
  assinaturasPendentes: number;
  conversasAbertas: number;
}

export interface DocumentoPortal {
  id: string;
  nome: string;
  mimeType: string;
  tamanhoBytes: string;
  criadoEm: string;
  versaoAtual: number;
  categoria: { id: string; nome: string } | null;
}

export interface TarefaPortal {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: string;
  status: string;
  dataVencimento: string;
  concluidaEm: string | null;
}

export interface AssinaturaPortal {
  id: string;
  status: string;
  criadoEm: string;
  documento: { id: string; nome: string };
  signatarios: Array<{
    id: string;
    nome: string;
    email: string;
    status: string;
    assinadoEm: string | null;
  }>;
}

export interface ConversaResumo {
  id: string;
  assunto: string | null;
  canal: string;
  status: string;
  ultimaMensagemEm: string | null;
  criadoEm: string;
  _count: { mensagens: number };
}

export interface MensagemPortal {
  id: string;
  conversaId: string;
  remetenteId: string | null;
  corpo: string;
  criadoEm: string;
  remetente: { id: string; nome: string } | null;
}

export interface ConversaCompleta extends ConversaResumo {
  mensagens: MensagemPortal[];
}

export function usePortalResumo() {
  return useQuery({
    queryKey: ['portal', 'resumo'],
    queryFn: () => clienteApi.get<ResumoPortal>('/portal-cliente/resumo'),
    staleTime: 30_000,
  });
}

export function usePortalDocumentos(termo: string) {
  return useQuery({
    queryKey: ['portal', 'documentos', termo],
    queryFn: () =>
      clienteApi.get<DocumentoPortal[]>(
        `/portal-cliente/documentos${termo ? `?termo=${encodeURIComponent(termo)}` : ''}`,
      ),
  });
}

export async function baixarDocumentoPortal(id: string): Promise<string> {
  const { url } = await clienteApi.get<{ url: string }>(`/portal-cliente/documentos/${id}/download`);
  return url;
}

export function usePortalTarefas() {
  return useQuery({
    queryKey: ['portal', 'tarefas'],
    queryFn: () => clienteApi.get<TarefaPortal[]>('/portal-cliente/tarefas'),
  });
}

export function usePortalAssinaturas() {
  return useQuery({
    queryKey: ['portal', 'assinaturas'],
    queryFn: () => clienteApi.get<AssinaturaPortal[]>('/portal-cliente/assinaturas'),
  });
}

export function usePortalConversas() {
  return useQuery({
    queryKey: ['portal', 'conversas'],
    queryFn: () => clienteApi.get<ConversaResumo[]>('/portal-cliente/conversas'),
  });
}

export function usePortalConversa(id: string | null) {
  return useQuery({
    queryKey: ['portal', 'conversas', id],
    queryFn: () => clienteApi.get<ConversaCompleta>(`/portal-cliente/conversas/${id}`),
    enabled: !!id,
  });
}

export function useAbrirConversa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { assunto?: string; corpo: string }) =>
      clienteApi.post<ConversaCompleta>('/portal-cliente/conversas', dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'conversas'] }),
  });
}

export function useEnviarMensagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversaId, corpo }: { conversaId: string; corpo: string }) =>
      clienteApi.post<MensagemPortal>(`/portal-cliente/conversas/${conversaId}/mensagens`, { corpo }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['portal', 'conversas'] });
      qc.invalidateQueries({ queryKey: ['portal', 'conversas', vars.conversaId] });
    },
  });
}

export function useMarcarConversaLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversaId: string) =>
      clienteApi.patch<{ ok: boolean }>(`/portal-cliente/conversas/${conversaId}/marcar-lida`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'conversas'] }),
  });
}
