'use client';

import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Botao } from '@contabilpro/ui';
import type { CanalConversa, StatusConversa } from '@contabilpro/contracts';

import {
  useConversa,
  useConversas,
  useEnviarMensagem,
  useMarcarConversaLida,
  useMudarStatusConversa,
  useSocketAtendimento,
} from '@/lib/hooks-atendimento';
import { formatarData } from '@/lib/formatadores';

const STATUS_LABEL: Record<StatusConversa, string> = {
  ABERTA: 'Aberta',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  EM_ATENDIMENTO: 'Em atendimento',
  RESOLVIDA: 'Resolvida',
  ARQUIVADA: 'Arquivada',
};

const CANAL_LABEL: Record<CanalConversa, string> = {
  PORTAL: 'Portal',
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
};

const COR_STATUS: Record<StatusConversa, string> = {
  ABERTA: 'bg-primary/10 text-primary border-primary/20',
  AGUARDANDO_CLIENTE: 'bg-accent/15 text-accent border-accent/20',
  EM_ATENDIMENTO: 'bg-primary/15 text-primary border-primary/30',
  RESOLVIDA: 'bg-secondary/15 text-secondary border-secondary/20',
  ARQUIVADA: 'bg-muted text-muted-foreground border-border',
};

export default function PaginaAtendimento() {
  const [selecionadaId, setSelecionadaId] = useState<string | undefined>(undefined);
  const [filtroStatus, setFiltroStatus] = useState<StatusConversa | ''>('');
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');

  useSocketAtendimento(selecionadaId);

  const conversas = useConversas({
    status: filtroStatus || undefined,
    termo: busca || undefined,
    tamanho: 50,
    pagina: 1,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Atendimento</h1>
        <p className="text-sm text-muted-foreground">
          Conversas com clientes pelos canais conectados ao escritório.
        </p>
      </div>

      <div className="flex h-[calc(100vh-12rem)] gap-4">
        <aside className="flex w-80 flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-card-soft">
          <div className="space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setBusca(termo.trim());
              }}
              className="flex gap-1"
            >
              <input
                type="search"
                placeholder="Buscar..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <Botao tamanho="sm" variante="contorno" type="submit">
                Ir
              </Botao>
            </form>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as StatusConversa | '')}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <ul className="flex-1 space-y-1 overflow-y-auto">
            {conversas.isLoading && (
              <li className="p-2 text-sm text-muted-foreground">Carregando...</li>
            )}
            {conversas.data?.itens.length === 0 && (
              <li className="flex flex-col items-center gap-2 p-6 text-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground/60" />
                <span className="text-sm text-muted-foreground">Nenhuma conversa.</span>
              </li>
            )}
            {conversas.data?.itens.map((c) => {
              const naoLidas = c._count?.mensagens ?? 0;
              const ativa = c.id === selecionadaId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionadaId(c.id)}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
                      ativa
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {c.assunto ?? '(sem assunto)'}
                      </span>
                      {naoLidas > 0 && (
                        <span className="rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
                          {naoLidas}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {c.empresa?.razaoSocial ?? '—'} · {CANAL_LABEL[c.canal]}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${COR_STATUS[c.status]}`}
                      >
                        {STATUS_LABEL[c.status]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {c.ultimaMensagemEm ? formatarData(c.ultimaMensagemEm) : ''}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex flex-1 flex-col rounded-lg border border-border bg-card shadow-card-soft">
          {selecionadaId ? (
            <PainelChat conversaId={selecionadaId} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
              Selecione uma conversa à esquerda.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PainelChat({ conversaId }: { conversaId: string }) {
  const consulta = useConversa(conversaId);
  const enviar = useEnviarMensagem(conversaId);
  const mudarStatus = useMudarStatusConversa(conversaId);
  const marcarLida = useMarcarConversaLida(conversaId);
  const [texto, setTexto] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consulta.data) {
      marcarLida.mutate();
      fimRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta.data?.mensagens.length]);

  if (consulta.isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Carregando conversa...</div>;
  }
  if (consulta.isError || !consulta.data) {
    return <div className="p-4 text-sm text-destructive">Erro ao carregar conversa.</div>;
  }

  const conversa = consulta.data;

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    setTexto('');
    await enviar.mutateAsync(conteudo);
  }

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-semibold">{conversa.assunto ?? '(sem assunto)'}</h2>
          <p className="text-sm text-muted-foreground">
            {conversa.empresa?.razaoSocial ?? '—'} · {CANAL_LABEL[conversa.canal]}
          </p>
        </div>
        <select
          value={conversa.status}
          onChange={(e) => mudarStatus.mutate(e.target.value as StatusConversa)}
          className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring/20 ${COR_STATUS[conversa.status]}`}
        >
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4">
        {conversa.mensagens.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Sem mensagens ainda.</p>
        )}
        {conversa.mensagens.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.remetente ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-md rounded-lg px-3 py-2 text-sm shadow-card-soft ${
                m.remetente
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground border border-border'
              }`}
            >
              {m.corpo}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {m.remetente?.nome ?? 'cliente'} · {formatarData(m.criadoEm)}
            </div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <form onSubmit={aoEnviar} className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite uma mensagem..."
          rows={2}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void aoEnviar(e);
            }
          }}
        />
        <Botao type="submit" disabled={enviar.isPending || !texto.trim()}>
          <span className="inline-flex items-center gap-1">
            <Send className="h-4 w-4" />
            {enviar.isPending ? 'Enviando...' : 'Enviar'}
          </span>
        </Botao>
      </form>
    </>
  );
}
