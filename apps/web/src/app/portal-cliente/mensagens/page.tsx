'use client';

import { useEffect, useState } from 'react';

import {
  useAbrirConversa,
  useEnviarMensagem,
  useMarcarConversaLida,
  usePortalConversa,
  usePortalConversas,
} from '@/lib/hooks-portal-cliente';

export default function PaginaPortalMensagens() {
  const conversas = usePortalConversas();
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);

  useEffect(() => {
    if (!selecionada && conversas.data && conversas.data.length > 0) {
      setSelecionada(conversas.data[0]?.id ?? null);
    }
  }, [conversas.data, selecionada]);

  return (
    <div className="grid h-[calc(100vh-160px)] grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <aside className="overflow-y-auto rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-medium">Conversas</h2>
          <button
            onClick={() => setNovaAberta(true)}
            className="rounded-md border px-2 py-0.5 text-xs hover:bg-accent"
          >
            Nova
          </button>
        </div>
        {conversas.isLoading && (
          <p className="p-3 text-sm text-muted-foreground">Carregando…</p>
        )}
        {conversas.data?.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
        )}
        <ul>
          {conversas.data?.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelecionada(c.id)}
                className={`w-full border-b px-3 py-2 text-left last:border-0 hover:bg-accent ${
                  selecionada === c.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{c.assunto ?? '(sem assunto)'}</span>
                  {c._count.mensagens > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                      {c._count.mensagens}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.ultimaMensagemEm
                    ? new Date(c.ultimaMensagemEm).toLocaleString('pt-BR')
                    : new Date(c.criadoEm).toLocaleString('pt-BR')}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex flex-col rounded-lg border bg-card">
        {selecionada ? (
          <PainelConversa id={selecionada} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione uma conversa ou abra uma nova.
          </div>
        )}
      </section>

      {novaAberta && (
        <ModalNovaConversa
          aoFechar={() => setNovaAberta(false)}
          aoCriar={(id) => {
            setSelecionada(id);
            setNovaAberta(false);
          }}
        />
      )}
    </div>
  );
}

function PainelConversa({ id }: { id: string }) {
  const { data } = usePortalConversa(id);
  const enviar = useEnviarMensagem();
  const marcarLida = useMarcarConversaLida();
  const [corpo, setCorpo] = useState('');

  useEffect(() => {
    if (id) marcarLida.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!corpo.trim()) return;
    await enviar.mutateAsync({ conversaId: id, corpo: corpo.trim() });
    setCorpo('');
  }

  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-sm">Carregando…</div>;
  }

  return (
    <>
      <header className="border-b p-3">
        <div className="font-medium">{data.assunto ?? '(sem assunto)'}</div>
        <div className="text-xs text-muted-foreground">Canal: {data.canal}</div>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {data.mensagens.map((m) => (
          <BalaoMensagem key={m.id} mensagem={m} />
        ))}
      </div>
      <form onSubmit={aoEnviar} className="border-t p-3">
        <div className="flex gap-2">
          <input
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="Digite uma mensagem…"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={enviar.isPending || !corpo.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </>
  );
}

function BalaoMensagem({
  mensagem,
}: {
  mensagem: {
    id: string;
    corpo: string;
    criadoEm: string;
    remetente: { id: string; nome: string } | null;
  };
}) {
  const ehSistema = !mensagem.remetente;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs text-muted-foreground">
        {ehSistema ? 'Sistema' : mensagem.remetente?.nome}
        {' · '}
        {new Date(mensagem.criadoEm).toLocaleString('pt-BR')}
      </div>
      <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm">{mensagem.corpo}</div>
    </div>
  );
}

function ModalNovaConversa({
  aoFechar,
  aoCriar,
}: {
  aoFechar: () => void;
  aoCriar: (id: string) => void;
}) {
  const abrir = useAbrirConversa();
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      const conversa = await abrir.mutateAsync({
        assunto: assunto.trim() || undefined,
        corpo: corpo.trim(),
      });
      aoCriar(conversa.id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao abrir conversa');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-md space-y-3 rounded-lg bg-card p-5 shadow-lg"
      >
        <h3 className="text-lg font-semibold">Nova conversa</h3>
        <label className="block text-sm">
          <span className="text-muted-foreground">Assunto (opcional)</span>
          <input
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            maxLength={160}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Mensagem</span>
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            required
            minLength={1}
            rows={5}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        {erro && (
          <p className="rounded-md bg-destructive/10 px-2 py-1 text-sm text-destructive">{erro}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={abrir.isPending || !corpo.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {abrir.isPending ? 'Enviando…' : 'Iniciar conversa'}
          </button>
        </div>
      </form>
    </div>
  );
}
