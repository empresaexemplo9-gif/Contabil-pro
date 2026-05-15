'use client';

import {
  Bell,
  Bot,
  CheckCircle2,
  ListPlus,
  Mail,
  MessageSquare,
  Pause,
  PauseCircle,
  Play,
  Workflow,
  Zap,
} from 'lucide-react';

import type { Automacao, Passo, TipoGatilho } from '@contabilpro/contracts';

import {
  useAtivarAutomacao,
  useAutomacoes,
  usePausarAutomacao,
} from '@/lib/hooks-automacoes';
import { formatarData } from '@/lib/formatadores';

const ROTULO_GATILHO: Record<TipoGatilho, string> = {
  TAREFA_CRIADA: 'Tarefa criada',
  TAREFA_CONCLUIDA: 'Tarefa concluída',
  TAREFA_ATRASADA: 'Tarefa atrasada',
  DOCUMENTO_ENVIADO: 'Documento enviado',
  EMPRESA_CADASTRADA: 'Empresa cadastrada',
  MENSAGEM_RECEBIDA: 'Mensagem recebida',
};

const ROTULO_PASSO: Record<Passo['tipo'], string> = {
  CRIAR_NOTIFICACAO: 'Criar notificação',
  ENVIAR_EMAIL: 'Enviar e-mail',
  ENVIAR_WHATSAPP: 'Enviar WhatsApp',
  CRIAR_TAREFA: 'Criar tarefa',
};

function iconePasso(tipo: Passo['tipo']) {
  switch (tipo) {
    case 'CRIAR_NOTIFICACAO':
      return <Bell className="h-3.5 w-3.5" />;
    case 'ENVIAR_EMAIL':
      return <Mail className="h-3.5 w-3.5" />;
    case 'ENVIAR_WHATSAPP':
      return <MessageSquare className="h-3.5 w-3.5" />;
    case 'CRIAR_TAREFA':
      return <ListPlus className="h-3.5 w-3.5" />;
  }
}

function pillStatus(status: Automacao['status']) {
  if (status === 'ATIVA')
    return 'bg-secondary/15 text-secondary border-secondary/20';
  if (status === 'PAUSADA')
    return 'bg-accent/15 text-accent border-accent/20';
  return 'bg-muted text-muted-foreground border-border';
}

function rotuloStatus(status: Automacao['status']) {
  if (status === 'ATIVA') return 'Ativa';
  if (status === 'PAUSADA') return 'Pausada';
  return 'Rascunho';
}

export default function PaginaAutomacoes() {
  const automacoes = useAutomacoes();
  const ativar = useAtivarAutomacao();
  const pausar = usePausarAutomacao();

  const lista = automacoes.data ?? [];
  const ativas = lista.filter((a) => a.status === 'ATIVA').length;
  const pausadas = lista.filter((a) => a.status === 'PAUSADA').length;
  const rascunhos = lista.filter((a) => a.status === 'RASCUNHO').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Automações</h1>
        <p className="text-sm text-muted-foreground">
          Fluxos automatizados disparados por gatilhos do sistema.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CartaoMetrica
          titulo="Ativas"
          valor={ativas}
          acento="success"
          icone={<CheckCircle2 className="h-4 w-4" />}
        />
        <CartaoMetrica
          titulo="Pausadas"
          valor={pausadas}
          acento="warning"
          icone={<PauseCircle className="h-4 w-4" />}
        />
        <CartaoMetrica titulo="Rascunhos" valor={rascunhos} icone={<Workflow className="h-4 w-4" />} />
        <CartaoMetrica titulo="Total" valor={lista.length} icone={<Zap className="h-4 w-4" />} />
      </section>

      {automacoes.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {automacoes.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Falha ao carregar automações.
        </p>
      )}

      {!automacoes.isLoading && lista.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h2 className="mt-3 font-medium">Nenhuma automação configurada</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Automações reagem a eventos como criação de tarefas, recebimento de documentos
            ou novas mensagens. A criação visual será adicionada em breve — por enquanto,
            automações são provisionadas via API ou seeds.
          </p>
        </div>
      )}

      {lista.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {lista.map((auto) => (
            <li
              key={auto.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-card-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-medium">{auto.nome}</h2>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${pillStatus(auto.status)}`}
                    >
                      {rotuloStatus(auto.status)}
                    </span>
                  </div>
                  {auto.descricao && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {auto.descricao}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {auto.status === 'ATIVA' ? (
                    <button
                      type="button"
                      onClick={() => pausar.mutate(auto.id)}
                      disabled={pausar.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition hover:bg-muted disabled:opacity-50"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pausar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => ativar.mutate(auto.id)}
                      disabled={ativar.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Ativar
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  <Zap className="h-3 w-3" />
                  Quando: {ROTULO_GATILHO[auto.gatilho.tipo]}
                </span>
                {auto.gatilho.condicoes.length > 0 && (
                  <span className="text-muted-foreground">
                    + {auto.gatilho.condicoes.length} condição(ões)
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ações ({auto.passos.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {auto.passos.map((passo, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                    >
                      {iconePasso(passo.tipo)}
                      {ROTULO_PASSO[passo.tipo]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                <span>Criada em {formatarData(auto.criadoEm)}</span>
                <span>Atualizada em {formatarData(auto.atualizadoEm)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CartaoMetrica({
  titulo,
  valor,
  acento,
  icone,
}: {
  titulo: string;
  valor: number;
  acento?: 'success' | 'warning' | 'destructive';
  icone?: React.ReactNode;
}) {
  const corValor =
    acento === 'destructive'
      ? 'text-destructive'
      : acento === 'warning'
        ? 'text-accent'
        : acento === 'success'
          ? 'text-secondary'
          : 'text-foreground';
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-card-soft">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icone}
        <span>{titulo}</span>
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${corValor}`}>{valor}</div>
    </div>
  );
}
