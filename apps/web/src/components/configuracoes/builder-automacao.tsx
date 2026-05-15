'use client';

import { useState } from 'react';

import { useCriarAutomacao } from '@/lib/hooks-configuracoes';

const GATILHOS = [
  { valor: 'TAREFA_CRIADA', rotulo: 'Tarefa criada' },
  { valor: 'TAREFA_CONCLUIDA', rotulo: 'Tarefa concluída' },
  { valor: 'TAREFA_ATRASADA', rotulo: 'Tarefa atrasada' },
  { valor: 'DOCUMENTO_ENVIADO', rotulo: 'Documento enviado' },
  { valor: 'EMPRESA_CADASTRADA', rotulo: 'Empresa cadastrada' },
  { valor: 'MENSAGEM_RECEBIDA', rotulo: 'Mensagem recebida' },
] as const;

const OPERADORES = [
  { valor: 'eq', rotulo: 'igual a' },
  { valor: 'neq', rotulo: 'diferente de' },
  { valor: 'contains', rotulo: 'contém' },
  { valor: 'in', rotulo: 'em (lista)' },
  { valor: 'gt', rotulo: 'maior que' },
  { valor: 'lt', rotulo: 'menor que' },
] as const;

const TIPOS_PASSO = [
  { valor: 'CRIAR_NOTIFICACAO', rotulo: 'Criar notificação' },
  { valor: 'ENVIAR_EMAIL', rotulo: 'Enviar e-mail' },
  { valor: 'ENVIAR_WHATSAPP', rotulo: 'Enviar WhatsApp' },
  { valor: 'CRIAR_TAREFA', rotulo: 'Criar tarefa' },
] as const;

type TipoPasso = (typeof TIPOS_PASSO)[number]['valor'];

interface Condicao {
  campo: string;
  operador: string;
  valor: string;
}

interface Passo {
  tipo: TipoPasso;
  config: Record<string, string>;
}

const CONFIGS_INICIAIS: Record<TipoPasso, Record<string, string>> = {
  CRIAR_NOTIFICACAO: {
    usuarioId: '{{tarefa.responsavelId}}',
    titulo: '',
    corpo: '',
    tipo: 'SISTEMA',
  },
  ENVIAR_EMAIL: { para: '', assunto: '', corpoHtml: '' },
  ENVIAR_WHATSAPP: { para: '', texto: '' },
  CRIAR_TAREFA: {
    titulo: '',
    descricao: '',
    dataVencimento: '',
    prioridade: 'MEDIA',
  },
};

const CAMPOS_POR_PASSO: Record<TipoPasso, Array<{ chave: string; rotulo: string; textarea?: boolean }>> = {
  CRIAR_NOTIFICACAO: [
    { chave: 'usuarioId', rotulo: 'ID do usuário (aceita template, ex.: {{tarefa.responsavelId}})' },
    { chave: 'titulo', rotulo: 'Título' },
    { chave: 'corpo', rotulo: 'Corpo', textarea: true },
    { chave: 'tipo', rotulo: 'Tipo (SISTEMA, TAREFA_VENCENDO, ...)' },
  ],
  ENVIAR_EMAIL: [
    { chave: 'para', rotulo: 'Para (e-mail)' },
    { chave: 'assunto', rotulo: 'Assunto' },
    { chave: 'corpoHtml', rotulo: 'Corpo HTML', textarea: true },
  ],
  ENVIAR_WHATSAPP: [
    { chave: 'para', rotulo: 'Telefone (com DDD, só dígitos)' },
    { chave: 'texto', rotulo: 'Mensagem', textarea: true },
  ],
  CRIAR_TAREFA: [
    { chave: 'titulo', rotulo: 'Título' },
    { chave: 'descricao', rotulo: 'Descrição', textarea: true },
    { chave: 'dataVencimento', rotulo: 'Vencimento (ISO ou template)' },
    { chave: 'prioridade', rotulo: 'Prioridade (BAIXA, MEDIA, ALTA, URGENTE)' },
  ],
};

export function BuilderAutomacao({ aoFechar }: { aoFechar: () => void }) {
  const criar = useCriarAutomacao();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [gatilhoTipo, setGatilhoTipo] = useState<string>('TAREFA_CRIADA');
  const [condicoes, setCondicoes] = useState<Condicao[]>([]);
  const [passos, setPassos] = useState<Passo[]>([
    { tipo: 'CRIAR_NOTIFICACAO', config: { ...CONFIGS_INICIAIS.CRIAR_NOTIFICACAO } },
  ]);
  const [ativar, setAtivar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function adicionarCondicao() {
    setCondicoes((c) => [...c, { campo: '', operador: 'eq', valor: '' }]);
  }
  function removerCondicao(i: number) {
    setCondicoes((c) => c.filter((_, idx) => idx !== i));
  }
  function atualizarCondicao(i: number, parcial: Partial<Condicao>) {
    setCondicoes((c) => c.map((cond, idx) => (idx === i ? { ...cond, ...parcial } : cond)));
  }

  function adicionarPasso() {
    setPassos((p) => [
      ...p,
      { tipo: 'CRIAR_NOTIFICACAO', config: { ...CONFIGS_INICIAIS.CRIAR_NOTIFICACAO } },
    ]);
  }
  function removerPasso(i: number) {
    setPassos((p) => p.filter((_, idx) => idx !== i));
  }
  function mudarTipoPasso(i: number, tipo: TipoPasso) {
    setPassos((p) =>
      p.map((passo, idx) => (idx === i ? { tipo, config: { ...CONFIGS_INICIAIS[tipo] } } : passo)),
    );
  }
  function atualizarConfig(i: number, chave: string, valor: string) {
    setPassos((p) =>
      p.map((passo, idx) => (idx === i ? { ...passo, config: { ...passo.config, [chave]: valor } } : passo)),
    );
  }
  function moverPasso(i: number, direcao: -1 | 1) {
    setPassos((p) => {
      const j = i + direcao;
      if (j < 0 || j >= p.length) return p;
      const copia = [...p];
      [copia[i], copia[j]] = [copia[j]!, copia[i]!];
      return copia;
    });
  }

  async function aoSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nome.trim()) {
      setErro('Informe o nome da automação');
      return;
    }
    if (passos.length === 0) {
      setErro('Adicione ao menos um passo');
      return;
    }

    const condicoesNormalizadas = condicoes
      .filter((c) => c.campo.trim() && c.valor.trim())
      .map((c) => ({
        campo: c.campo.trim(),
        operador: c.operador,
        valor: interpretarValor(c.valor),
      }));

    const corpo = {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      gatilho: { tipo: gatilhoTipo, condicoes: condicoesNormalizadas },
      passos: passos.map((p) => ({
        tipo: p.tipo,
        config: limparConfig(p.config),
      })),
      ativar,
    };

    try {
      await criar.mutateAsync(corpo);
      aoFechar();
    } catch (e) {
      setErro((e as Error).message || 'Falha ao salvar automação');
    }
  }

  return (
    <form onSubmit={aoSalvar} className="space-y-5 rounded-lg border bg-card p-4">
      <header className="flex items-center justify-between">
        <h3 className="font-medium">Nova automação</h3>
        <button
          type="button"
          onClick={aoFechar}
          className="text-xs text-muted-foreground hover:underline"
        >
          Cancelar
        </button>
      </header>

      <section className="space-y-2">
        <Rotulo texto="Nome">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Notificar responsável quando tarefa for criada"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Rotulo>
        <Rotulo texto="Descrição (opcional)">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Rotulo>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium">Gatilho</h4>
        <select
          value={gatilhoTipo}
          onChange={(e) => setGatilhoTipo(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {GATILHOS.map((g) => (
            <option key={g.valor} value={g.valor}>
              {g.rotulo}
            </option>
          ))}
        </select>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Condições adicionais (opcional, todas precisam ser verdadeiras)
            </span>
            <button
              type="button"
              onClick={adicionarCondicao}
              className="text-xs text-primary hover:underline"
            >
              + condição
            </button>
          </div>
          {condicoes.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="campo (ex.: tarefa.prioridade)"
                value={c.campo}
                onChange={(e) => atualizarCondicao(i, { campo: e.target.value })}
                className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
              />
              <select
                value={c.operador}
                onChange={(e) => atualizarCondicao(i, { operador: e.target.value })}
                className="rounded-md border bg-background px-2 py-1 text-xs"
              >
                {OPERADORES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
              <input
                placeholder="valor"
                value={c.valor}
                onChange={(e) => atualizarCondicao(i, { valor: e.target.value })}
                className="w-32 rounded-md border bg-background px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => removerCondicao(i)}
                className="text-xs text-destructive hover:underline"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Passos</h4>
          <button
            type="button"
            onClick={adicionarPasso}
            className="text-xs text-primary hover:underline"
          >
            + passo
          </button>
        </div>
        {passos.map((p, i) => (
          <div key={i} className="space-y-2 rounded-md border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{i + 1}</span>
                <select
                  value={p.tipo}
                  onChange={(e) => mudarTipoPasso(i, e.target.value as TipoPasso)}
                  className="rounded-md border bg-card px-2 py-1 text-xs"
                >
                  {TIPOS_PASSO.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.rotulo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moverPasso(i, -1)}
                  disabled={i === 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moverPasso(i, 1)}
                  disabled={i === passos.length - 1}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removerPasso(i)}
                  className="text-xs text-destructive hover:underline"
                >
                  ✕
                </button>
              </div>
            </div>
            {CAMPOS_POR_PASSO[p.tipo].map((campo) => (
              <Rotulo key={campo.chave} texto={campo.rotulo}>
                {campo.textarea ? (
                  <textarea
                    value={p.config[campo.chave] ?? ''}
                    onChange={(e) => atualizarConfig(i, campo.chave, e.target.value)}
                    rows={2}
                    className="w-full rounded-md border bg-card px-2 py-1 text-xs"
                  />
                ) : (
                  <input
                    value={p.config[campo.chave] ?? ''}
                    onChange={(e) => atualizarConfig(i, campo.chave, e.target.value)}
                    className="w-full rounded-md border bg-card px-2 py-1 text-xs"
                  />
                )}
              </Rotulo>
            ))}
          </div>
        ))}
      </section>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ativar} onChange={(e) => setAtivar(e.target.checked)} />
        Ativar imediatamente após salvar
      </label>

      <p className="text-xs text-muted-foreground">
        Dica: use <code className="rounded bg-muted px-1">{'{{ caminho.aninhado }}'}</code> em
        qualquer campo para interpolar dados do evento (ex.:{' '}
        <code className="rounded bg-muted px-1">{'{{tarefa.titulo}}'}</code>).
      </p>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={criar.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {criar.isPending ? 'Salvando...' : 'Salvar automação'}
        </button>
      </div>
    </form>
  );
}

function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{texto}</span>
      {children}
    </label>
  );
}

/**
 * Limpa strings vazias da config — campos opcionais devem virar undefined
 * para o Zod aceitar.
 */
function limparConfig(config: Record<string, string>): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    if (v.trim() !== '') saida[k] = v;
  }
  return saida;
}

/**
 * Converte string em número/booleano/array quando aplicável; senão mantém
 * como string. Usado para condicoes.valor.
 */
function interpretarValor(valor: string): unknown {
  const t = valor.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t.startsWith('[') && t.endsWith(']')) {
    try {
      return JSON.parse(t);
    } catch {
      return t;
    }
  }
  return t;
}
