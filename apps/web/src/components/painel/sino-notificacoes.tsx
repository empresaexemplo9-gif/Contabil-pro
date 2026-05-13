'use client';

import { Bell, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  useMarcarNotificacaoLida,
  useNotificacoes,
  type NotificacaoApi,
} from '@/lib/hooks-notificacoes';

const ROTULO_TIPO: Record<string, string> = {
  TAREFA_ATRIBUIDA: 'Tarefa atribuída',
  TAREFA_VENCENDO: 'Tarefa vencendo',
  DOCUMENTO_NOVO: 'Documento novo',
  ASSINATURA_PENDENTE: 'Assinatura pendente',
};

export function SinoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data } = useNotificacoes();
  const marcar = useMarcarNotificacaoLida();

  const naoLidas = (data ?? []).filter((n) => !n.lidaEm);

  useEffect(() => {
    function aoClicar(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setAberto(false);
    }
    if (aberto) {
      document.addEventListener('mousedown', aoClicar);
      return () => document.removeEventListener('mousedown', aoClicar);
    }
  }, [aberto]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Notificações"
        className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {naoLidas.length > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
            {naoLidas.length > 9 ? '9+' : naoLidas.length}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-card-soft">
          <header className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">Notificações</span>
            <span className="text-xs text-muted-foreground">
              {naoLidas.length > 0 ? `${naoLidas.length} nova(s)` : 'Tudo em dia'}
            </span>
          </header>
          <ul className="max-h-96 overflow-y-auto">
            {(data ?? []).length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                Sem notificações por enquanto.
              </li>
            )}
            {(data ?? []).slice(0, 20).map((n) => (
              <Item key={n.id} notificacao={n} onMarcar={() => marcar.mutate(n.id)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Item({
  notificacao,
  onMarcar,
}: {
  notificacao: NotificacaoApi;
  onMarcar: () => void;
}) {
  const ehNova = !notificacao.lidaEm;
  return (
    <li
      className={`group flex gap-2 border-b border-border px-3 py-2 last:border-0 ${
        ehNova ? 'bg-secondary/40' : ''
      }`}
    >
      <span
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
          ehNova ? 'bg-primary' : 'bg-transparent'
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-medium">{notificacao.titulo}</span>
          {ehNova && (
            <button
              onClick={onMarcar}
              title="Marcar como lida"
              className="opacity-0 transition group-hover:opacity-100"
            >
              <Check className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{notificacao.corpo}</p>
        <div className="mt-0.5 text-[10px] text-muted-foreground/70">
          {ROTULO_TIPO[notificacao.tipo] ?? notificacao.tipo} ·{' '}
          {new Date(notificacao.criadoEm).toLocaleString('pt-BR')}
        </div>
      </div>
    </li>
  );
}
