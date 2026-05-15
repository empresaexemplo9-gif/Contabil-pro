'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Botao } from '@contabilpro/ui';
import {
  criarModeloObrigacaoSchema,
  type CriarModeloObrigacaoEntrada,
  type ModeloObrigacao,
} from '@contabilpro/contracts';

import {
  useCriarModeloObrigacao,
  useDesativarModeloObrigacao,
  useGerarTarefas,
  useModelosObrigacao,
} from '@/lib/hooks-tarefas';
import { rotuloFrequencia, rotuloRegime } from '@/lib/formatadores';

const REGIMES = ['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI', 'IMUNE_ISENTO'] as const;
const FREQUENCIAS = ['UNICA', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] as const;

export default function PaginaObrigacoes() {
  const [adicionando, setAdicionando] = useState(false);
  const modelos = useModelosObrigacao(true);
  const criar = useCriarModeloObrigacao();
  const desativar = useDesativarModeloObrigacao();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Obrigações</h1>
          <p className="text-sm text-muted-foreground">
            Modelos recorrentes que geram tarefas automaticamente para todas as empresas
            aplicáveis.
          </p>
        </div>
        {!adicionando && (
          <button
            type="button"
            onClick={() => setAdicionando(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card-soft transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo modelo
          </button>
        )}
      </div>

      {adicionando && (
        <FormularioModelo
          aoCancelar={() => setAdicionando(false)}
          aoSalvar={async (dados) => {
            await criar.mutateAsync(dados);
            setAdicionando(false);
          }}
          emEnvio={criar.isPending}
        />
      )}

      {modelos.isLoading && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}

      <ul className="space-y-3">
        {modelos.data?.map((modelo) => (
          <CartaoModelo
            key={modelo.id}
            modelo={modelo}
            aoDesativar={() => desativar.mutate(modelo.id)}
          />
        ))}
        {modelos.data?.length === 0 && !adicionando && (
          <li className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum modelo de obrigação cadastrado.
            </p>
            <button
              type="button"
              onClick={() => setAdicionando(true)}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Criar o primeiro modelo
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

function CartaoModelo({
  modelo,
  aoDesativar,
}: {
  modelo: ModeloObrigacao;
  aoDesativar: () => void;
}) {
  const [gerando, setGerando] = useState(false);
  const gerar = useGerarTarefas();
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [resultado, setResultado] = useState<string | null>(null);

  async function executarGeracao() {
    setResultado(null);
    try {
      const r = await gerar.mutateAsync({
        modeloId: modelo.id,
        dados: { mes, ano, prioridade: 'MEDIA' },
      });
      setResultado(
        `Geradas ${r.geradas} tarefa(s); ${r.ignoradas} já existiam (de ${r.total} empresas).`,
      );
    } catch {
      setResultado('Falha ao gerar tarefas.');
    }
  }

  return (
    <li
      className={`rounded-lg border border-border bg-card p-5 shadow-card-soft ${
        modelo.ativo ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            {modelo.nome}
            {!modelo.ativo && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                inativo
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {rotuloFrequencia(modelo.frequencia)}
            {modelo.diaVencimento && ` · dia ${modelo.diaVencimento}`}
            {modelo.regimes.length > 0 && ` · ${modelo.regimes.map(rotuloRegime).join(', ')}`}
          </p>
          {modelo.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">{modelo.descricao}</p>
          )}
        </div>
        {modelo.ativo && (
          <button
            type="button"
            onClick={aoDesativar}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Desativar
          </button>
        )}
      </div>

      {modelo.ativo && modelo.diaVencimento && (
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
          {!gerando ? (
            <Botao variante="contorno" tamanho="sm" onClick={() => setGerando(true)}>
              Gerar tarefas...
            </Botao>
          ) : (
            <>
              <label className="text-xs">
                <span className="block text-muted-foreground">Mês</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="mt-0.5 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </label>
              <label className="text-xs">
                <span className="block text-muted-foreground">Ano</span>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="mt-0.5 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </label>
              <Botao tamanho="sm" onClick={executarGeracao} disabled={gerar.isPending}>
                {gerar.isPending ? 'Gerando...' : 'Gerar'}
              </Botao>
              <Botao
                variante="fantasma"
                tamanho="sm"
                onClick={() => {
                  setGerando(false);
                  setResultado(null);
                }}
              >
                Cancelar
              </Botao>
              {resultado && (
                <p className="ml-2 text-xs text-muted-foreground">{resultado}</p>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

function FormularioModelo({
  aoSalvar,
  aoCancelar,
  emEnvio,
}: {
  aoSalvar: (d: CriarModeloObrigacaoEntrada) => Promise<void>;
  aoCancelar: () => void;
  emEnvio: boolean;
}) {
  const form = useForm<CriarModeloObrigacaoEntrada>({
    resolver: zodResolver(criarModeloObrigacaoSchema),
    defaultValues: { frequencia: 'MENSAL', regimes: [], ativo: true },
  });

  return (
    <form
      onSubmit={form.handleSubmit(aoSalvar)}
      className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card-soft"
    >
      <h2 className="font-medium">Novo modelo de obrigação</h2>

      <input
        {...form.register('nome')}
        placeholder="Nome da obrigação (ex.: DCTFWeb)"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
      <textarea
        {...form.register('descricao')}
        placeholder="Descrição (opcional)"
        rows={2}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          {...form.register('frequencia')}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        >
          {FREQUENCIAS.map((f) => (
            <option key={f} value={f}>
              {rotuloFrequencia(f)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={31}
          placeholder="Dia de vencimento"
          {...form.register('diaVencimento', { valueAsNumber: true })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>
      <fieldset className="space-y-1 rounded-md border border-border p-3 text-sm">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Regimes aplicáveis (vazio = todos)
        </legend>
        {REGIMES.map((r) => (
          <label key={r} className="flex items-center gap-2">
            <input type="checkbox" value={r} {...form.register('regimes')} />
            {rotuloRegime(r)}
          </label>
        ))}
      </fieldset>
      {form.formState.errors.nome && (
        <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
      )}
      <div className="flex justify-end gap-2">
        <Botao type="button" variante="fantasma" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={emEnvio}>
          {emEnvio ? 'Salvando...' : 'Salvar modelo'}
        </Botao>
      </div>
    </form>
  );
}
