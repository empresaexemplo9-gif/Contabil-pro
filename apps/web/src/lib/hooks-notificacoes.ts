'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clienteApi } from './cliente-api';

export interface NotificacaoApi {
  id: string;
  tipo: string;
  canal: string;
  titulo: string;
  corpo: string;
  lidaEm: string | null;
  criadoEm: string;
  dados: unknown;
}

export function useNotificacoes() {
  return useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => clienteApi.get<NotificacaoApi[]>('/notificacoes'),
    refetchInterval: 60_000,
  });
}

export function useMarcarNotificacaoLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.patch<{ count: number }>(`/notificacoes/${id}/lida`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}
