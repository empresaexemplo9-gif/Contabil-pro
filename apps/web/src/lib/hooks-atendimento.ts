'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type {
  BuscarConversas,
  Conversa,
  CriarConversaEntrada,
  Mensagem,
  StatusConversa,
} from '@contabilpro/contracts';

import { clienteApi } from './cliente-api';
import { obterSocketAtendimento } from './socket-atendimento';

interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
}

export type ConversaListada = Conversa & {
  empresa: { id: string; razaoSocial: string } | null;
  _count: { mensagens: number };
};

export type MensagemDetalhada = Mensagem & {
  remetente: { id: string; nome: string } | null;
};

export type ConversaDetalhada = Conversa & {
  empresa: { id: string; razaoSocial: string } | null;
  mensagens: MensagemDetalhada[];
};

function montarQuery(filtros: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function useConversas(filtros: Partial<BuscarConversas>) {
  return useQuery({
    queryKey: ['conversas', filtros],
    queryFn: () =>
      clienteApi.get<RespostaPaginada<ConversaListada>>(
        `/atendimento/conversas${montarQuery(filtros)}`,
      ),
  });
}

export function useConversa(id: string | undefined) {
  return useQuery({
    queryKey: ['conversa', id],
    queryFn: () => clienteApi.get<ConversaDetalhada>(`/atendimento/conversas/${id}`),
    enabled: Boolean(id),
  });
}

export function useCriarConversa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarConversaEntrada) =>
      clienteApi.post<Conversa>('/atendimento/conversas', dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversas'] }),
  });
}

export function useEnviarMensagem(conversaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (texto: string) =>
      clienteApi.post<MensagemDetalhada>(`/atendimento/conversas/${conversaId}/mensagens`, {
        texto,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversa', conversaId] });
      void qc.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
}

export function useMudarStatusConversa(conversaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: StatusConversa) =>
      clienteApi.patch<Conversa>(`/atendimento/conversas/${conversaId}/status`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversa', conversaId] });
      void qc.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
}

export function useMarcarConversaLida(conversaId: string | undefined) {
  return useMutation({
    mutationFn: () =>
      clienteApi.post<{ ok: true }>(`/atendimento/conversas/${conversaId}/marcar-lida`, {}),
  });
}

/**
 * Conecta ao gateway, ingressa nas salas do escritório/conversa e dispara
 * invalidação de cache quando o servidor emite eventos.
 */
export function useSocketAtendimento(conversaIdSelecionada: string | undefined): void {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = obterSocketAtendimento();
    function aoMensagemNova(mensagem: MensagemDetalhada) {
      void qc.invalidateQueries({ queryKey: ['conversa', mensagem.conversaId] });
      void qc.invalidateQueries({ queryKey: ['conversas'] });
    }
    function aoConversaAtualizada(_payload: { conversaId: string }) {
      void qc.invalidateQueries({ queryKey: ['conversas'] });
    }
    socket.on('mensagem.nova', aoMensagemNova);
    socket.on('conversa.atualizada', aoConversaAtualizada);

    if (conversaIdSelecionada) {
      socket.emit('conversa.entrar', { conversaId: conversaIdSelecionada });
    }

    return () => {
      socket.off('mensagem.nova', aoMensagemNova);
      socket.off('conversa.atualizada', aoConversaAtualizada);
      if (conversaIdSelecionada) {
        socket.emit('conversa.sair', { conversaId: conversaIdSelecionada });
      }
    };
  }, [conversaIdSelecionada, qc]);
}
