'use client';

import { useQuery } from '@tanstack/react-query';

import type {
  FatiaConversasCanal,
  FatiaEmpresasRegime,
  FatiaTarefasStatus,
  PontoAtividade,
  ResumoDashboard,
} from '@contabilpro/contracts';

import { clienteApi } from './cliente-api';

const STALE_TIME = 60_000;

export function useResumoDashboard() {
  return useQuery({
    queryKey: ['relatorios', 'dashboard'],
    queryFn: () => clienteApi.get<ResumoDashboard>('/relatorios/dashboard'),
    staleTime: STALE_TIME,
  });
}

export function useTarefasPorStatus() {
  return useQuery({
    queryKey: ['relatorios', 'tarefas-por-status'],
    queryFn: () => clienteApi.get<FatiaTarefasStatus[]>('/relatorios/tarefas-por-status'),
    staleTime: STALE_TIME,
  });
}

export function useEmpresasPorRegime() {
  return useQuery({
    queryKey: ['relatorios', 'empresas-por-regime'],
    queryFn: () => clienteApi.get<FatiaEmpresasRegime[]>('/relatorios/empresas-por-regime'),
    staleTime: STALE_TIME,
  });
}

export function useConversasPorCanal() {
  return useQuery({
    queryKey: ['relatorios', 'conversas-por-canal'],
    queryFn: () => clienteApi.get<FatiaConversasCanal[]>('/relatorios/conversas-por-canal'),
    staleTime: STALE_TIME,
  });
}

export function useAtividade(dias = 30) {
  return useQuery({
    queryKey: ['relatorios', 'atividade', dias],
    queryFn: () => clienteApi.get<PontoAtividade[]>(`/relatorios/atividade?dias=${dias}`),
    staleTime: STALE_TIME,
  });
}
