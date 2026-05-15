'use client';

import { useState } from 'react';

import { BuilderAutomacao } from '@/components/configuracoes/builder-automacao';
import {
  useAtivarAutomacao,
  useAutomacoes,
  usePausarAutomacao,
} from '@/lib/hooks-configuracoes';
import { formatarData } from '@/lib/formatadores';

const COR_STATUS: Record<string, string> = {
  ATIVA: 'bg-emerald-100 text-emerald-800',
  PAUSADA: 'bg-amber-100 text-amber-800',
  RASCUNHO: 'bg-muted text-muted-foreground',
};

const ROTULO_GATILHO: Record<string, string> = {
  TAREFA_CRIADA: 'Tarefa criada',
  TAREFA_CONCLUIDA: 'Tarefa concluída',
  TAREFA_ATRASADA: 'Tarefa atrasada',
  DOCUMENTO_ENVIADO: 'Documento enviado',
  EMPRESA_CADASTRADA: 'Empresa cadastrada',
  MENSAGEM_RECEBIDA: 'Mensagem recebida',
};

export function AbaAutomacoes() {
  const { data, isLoading, error } = useAutomacoes();
  const ativar = useAtivarAutomacao();
  const pausar = usePausarAutomacao();
  const [construindo, setConstruindo] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Automações disparam ações (notificar, enviar e-mail/WhatsApp, criar tarefa)
          quando eventos do sistema acontecem.
        </p>
        {!construindo && (
          <button
            type="button"
            onClick={() => setConstruindo(true)}
            className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
          >
            + Nova automação
          </button>
        )}
      </div>

      {construindo && <BuilderAutomacao aoFechar={() => setConstruindo(false)} />}

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">Falha ao carregar automações.</p>}

      <ul className="divide-y rounded-lg border bg-card">
        {data?.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">
            Nenhuma automação cadastrada.
          </li>
        )}
        {data?.map((a) => {
          const tipoGatilho = a.gatilho?.tipo ?? '—';
          const totalPassos = Array.isArray(a.passos) ? a.passos.length : 0;
          return (
            <li key={a.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="font-medium">
                  {a.nome}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${COR_STATUS[a.status] ?? ''}`}
                  >
                    {a.status.toLowerCase()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Gatilho: {ROTULO_GATILHO[tipoGatilho] ?? tipoGatilho} · {totalPassos}{' '}
                  passo(s) · criada em {formatarData(a.criadoEm)}
                </div>
                {a.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground">{a.descricao}</p>
                )}
              </div>
              <div className="flex gap-2">
                {a.status === 'ATIVA' ? (
                  <button
                    type="button"
                    onClick={() => pausar.mutate(a.id)}
                    className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                  >
                    Pausar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => ativar.mutate(a.id)}
                    className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    Ativar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
