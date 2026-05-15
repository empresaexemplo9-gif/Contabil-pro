'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Automacao } from '@contabilpro/contracts';

import { clienteApi } from './cliente-api';

const CHAVE = ['automacoes'] as const;

export function useAutomacoes() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: () => clienteApi.get<Automacao[]>('/automacoes'),
  });
}

export function useAtivarAutomacao() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clienteApi.post<Automacao>(`/automacoes/${id}/ativar`, {}),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CHAVE }),
  });
}

export function usePausarAutomacao() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clienteApi.post<Automacao>(`/automacoes/${id}/pausar`, {}),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CHAVE }),
  });
}
