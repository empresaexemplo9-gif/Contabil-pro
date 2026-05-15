'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clienteApi } from './cliente-api';

export interface EscritorioAtual {
  id: string;
  slug: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  plano: string;
  status: string;
  configuracoes: Record<string, unknown>;
  criadoEm: string;
}

export interface MembroEquipe {
  id: string;
  papel: string;
  permissoes: string[];
  empresaId: string | null;
  criadoEm: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
    status: string;
  };
}

export interface IntegracaoResumo {
  id: string;
  provedor: string;
  nome: string;
  status: 'ATIVA' | 'INATIVA' | 'ERRO';
  ultimoErro: string | null;
  criadoEm: string;
}

export interface RegistroLogAuditoria {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  diff: unknown;
  ip: string | null;
  userAgent: string | null;
  criadoEm: string;
  ator: { id: string; nome: string; email: string } | null;
}

export interface RespostaAuditoria {
  itens: RegistroLogAuditoria[];
  proximoCursor: string | null;
}

export interface PapeisPermissoes {
  papeis: string[];
  permissoes: string[];
}

export function useEscritorioAtual() {
  return useQuery({
    queryKey: ['escritorio', 'atual'],
    queryFn: () => clienteApi.get<EscritorioAtual>('/escritorios/atual'),
    staleTime: 5 * 60_000,
  });
}

export function useEquipe() {
  return useQuery({
    queryKey: ['equipe'],
    queryFn: () => clienteApi.get<MembroEquipe[]>('/usuarios'),
  });
}

export interface NovoUsuarioEntrada {
  email: string;
  nome: string;
  papel: 'PROPRIETARIO' | 'ADMIN' | 'CONTADOR' | 'ASSISTENTE' | 'CLIENTE';
  empresaId?: string;
  telefone?: string;
  senhaTemporaria?: string;
}

export interface NovoUsuarioSaida {
  id: string;
  email: string;
  nome: string;
  papel: string;
  senhaTemporaria?: string;
}

export function useCriarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: NovoUsuarioEntrada) =>
      clienteApi.post<NovoUsuarioSaida>('/usuarios', dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipe'] }),
  });
}

export function useAlterarPapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      usuarioId,
      papel,
      empresaId,
    }: {
      usuarioId: string;
      papel: string;
      empresaId?: string | null;
    }) =>
      clienteApi.patch<{ ok: boolean }>(`/usuarios/${usuarioId}/papel`, {
        papel,
        empresaId: empresaId ?? null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipe'] }),
  });
}

export function useDesativarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId: string) =>
      clienteApi.delete<void>(`/usuarios/${usuarioId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipe'] }),
  });
}

export function useIntegracoes() {
  return useQuery({
    queryKey: ['integracoes'],
    queryFn: () => clienteApi.get<IntegracaoResumo[]>('/integracoes'),
  });
}

export function useCriarIntegracao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (corpo: Record<string, unknown>) =>
      clienteApi.post<{ id: string; status: string }>('/integracoes', corpo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integracoes'] }),
  });
}

export function useDesativarIntegracao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.post<{ ok: boolean }>(`/integracoes/${id}/desativar`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integracoes'] }),
  });
}

export function useRemoverIntegracao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clienteApi.delete<{ ok: boolean }>(`/integracoes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integracoes'] }),
  });
}

export function useAuditoria(filtros: {
  entidade?: string;
  acao?: string;
  cursor?: string;
}) {
  const params = new URLSearchParams();
  if (filtros.entidade) params.set('entidade', filtros.entidade);
  if (filtros.acao) params.set('acao', filtros.acao);
  if (filtros.cursor) params.set('cursor', filtros.cursor);
  const qs = params.toString();
  return useQuery({
    queryKey: ['auditoria', filtros],
    queryFn: () => clienteApi.get<RespostaAuditoria>(`/auditoria${qs ? `?${qs}` : ''}`),
  });
}

export function useAcoesAuditoria() {
  return useQuery({
    queryKey: ['auditoria', 'acoes'],
    queryFn: () => clienteApi.get<string[]>('/auditoria/acoes'),
    staleTime: 5 * 60_000,
  });
}

export function usePapeisPermissoes() {
  return useQuery({
    queryKey: ['rbac'],
    queryFn: async () => {
      const [papeis, permissoes] = await Promise.all([
        clienteApi.get<string[]>('/rbac/papeis'),
        clienteApi.get<string[]>('/rbac/permissoes'),
      ]);
      return { papeis, permissoes } satisfies PapeisPermissoes;
    },
    staleTime: 10 * 60_000,
  });
}

// --- Automações ---

export interface AutomacaoResumo {
  id: string;
  nome: string;
  descricao: string | null;
  status: 'ATIVA' | 'PAUSADA' | 'RASCUNHO';
  gatilho: { tipo?: string } & Record<string, unknown>;
  passos: unknown[];
  criadoEm: string;
}

export function useAutomacoes() {
  return useQuery({
    queryKey: ['automacoes'],
    queryFn: () => clienteApi.get<AutomacaoResumo[]>('/automacoes'),
  });
}

export function useAtivarAutomacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.post<AutomacaoResumo>(`/automacoes/${id}/ativar`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automacoes'] }),
  });
}

export function usePausarAutomacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.post<AutomacaoResumo>(`/automacoes/${id}/pausar`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automacoes'] }),
  });
}

export function useCriarAutomacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (corpo: Record<string, unknown>) =>
      clienteApi.post<AutomacaoResumo>('/automacoes', corpo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automacoes'] }),
  });
}
