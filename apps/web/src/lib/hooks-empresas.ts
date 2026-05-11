'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  BuscarEmpresas,
  ContatoEmpresa,
  CriarContatoEmpresaEntrada,
  CriarEmpresaEntrada,
  Empresa,
} from '@contabilpro/contracts';

import { clienteApi } from './cliente-api';

interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
}

function montarQuery(filtros: Partial<BuscarEmpresas>): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(chave, String(valor));
    }
  }
  const consulta = params.toString();
  return consulta ? `?${consulta}` : '';
}

export function useEmpresas(filtros: Partial<BuscarEmpresas>) {
  return useQuery({
    queryKey: ['empresas', filtros],
    queryFn: () => clienteApi.get<RespostaPaginada<Empresa>>(`/empresas${montarQuery(filtros)}`),
  });
}

export function useEmpresa(id: string | undefined) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => clienteApi.get<Empresa & { contatos: ContatoEmpresa[] }>(`/empresas/${id}`),
    enabled: Boolean(id),
  });
}

export function useCriarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarEmpresaEntrada) =>
      clienteApi.post<Empresa>('/empresas', dados),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useAtualizarEmpresa(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: Partial<CriarEmpresaEntrada>) =>
      clienteApi.patch<Empresa>(`/empresas/${id}`, dados),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['empresas'] });
      void qc.invalidateQueries({ queryKey: ['empresa', id] });
    },
  });
}

export function useInativarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clienteApi.delete<{ ok: true }>(`/empresas/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useCriarContato(empresaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarContatoEmpresaEntrada) =>
      clienteApi.post<ContatoEmpresa>(`/empresas/${empresaId}/contatos`, dados),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['empresa', empresaId] });
    },
  });
}

export function useRemoverContato(empresaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contatoId: string) =>
      clienteApi.delete<{ ok: true }>(`/empresas/${empresaId}/contatos/${contatoId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['empresa', empresaId] });
    },
  });
}
