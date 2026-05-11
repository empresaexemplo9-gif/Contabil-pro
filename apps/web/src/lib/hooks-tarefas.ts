'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AtualizarModeloObrigacaoEntrada,
  AtualizarTarefaEntrada,
  BuscarTarefas,
  CriarModeloObrigacaoEntrada,
  CriarTarefaEntrada,
  GerarTarefasEntrada,
  ModeloObrigacao,
  Tarefa,
} from '@contabilpro/contracts';

import { clienteApi } from './cliente-api';

interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
}

function montarQuery(filtros: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, String(valor));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export type TarefaListada = Tarefa & {
  empresa: { id: string; razaoSocial: string } | null;
  modelo: { id: string; nome: string } | null;
  responsavel: { id: string; nome: string } | null;
};

export interface MetricasTarefas {
  pendentes: number;
  emAndamento: number;
  atrasadas: number;
  vencemHoje: number;
  proximos7Dias: number;
  concluidasMes: number;
}

// --- Tarefas ---

export function useTarefas(filtros: Partial<BuscarTarefas>) {
  return useQuery({
    queryKey: ['tarefas', filtros],
    queryFn: () =>
      clienteApi.get<RespostaPaginada<TarefaListada>>(`/tarefas${montarQuery(filtros)}`),
  });
}

export function useMetricasTarefas() {
  return useQuery({
    queryKey: ['tarefas', 'metricas'],
    queryFn: () => clienteApi.get<MetricasTarefas>('/tarefas/metricas'),
  });
}

export function useCriarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarTarefaEntrada) => clienteApi.post<Tarefa>('/tarefas', dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefas'] }),
  });
}

export function useAtualizarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: AtualizarTarefaEntrada }) =>
      clienteApi.patch<Tarefa>(`/tarefas/${id}`, dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefas'] }),
  });
}

// --- Modelos de obrigação ---

export function useModelosObrigacao(incluirInativos = false) {
  return useQuery({
    queryKey: ['obrigacoes', 'modelos', { incluirInativos }],
    queryFn: () =>
      clienteApi.get<ModeloObrigacao[]>(
        `/obrigacoes/modelos${incluirInativos ? '?incluirInativos=true' : ''}`,
      ),
  });
}

export function useCriarModeloObrigacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarModeloObrigacaoEntrada) =>
      clienteApi.post<ModeloObrigacao>('/obrigacoes/modelos', dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obrigacoes', 'modelos'] }),
  });
}

export function useAtualizarModeloObrigacao(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: AtualizarModeloObrigacaoEntrada) =>
      clienteApi.patch<ModeloObrigacao>(`/obrigacoes/modelos/${id}`, dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obrigacoes', 'modelos'] }),
  });
}

export function useDesativarModeloObrigacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteApi.delete<{ ok: true }>(`/obrigacoes/modelos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obrigacoes', 'modelos'] }),
  });
}

export function useGerarTarefas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modeloId, dados }: { modeloId: string; dados: GerarTarefasEntrada }) =>
      clienteApi.post<{ geradas: number; ignoradas: number; total: number }>(
        `/obrigacoes/modelos/${modeloId}/gerar-tarefas`,
        dados,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefas'] }),
  });
}
