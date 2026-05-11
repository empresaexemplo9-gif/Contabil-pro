'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Botao } from '@contabilpro/ui';
import {
  criarContatoEmpresaSchema,
  type ContatoEmpresa,
  type CriarContatoEmpresaEntrada,
} from '@contabilpro/contracts';

import { useCriarContato, useRemoverContato } from '@/lib/hooks-empresas';

interface Props {
  empresaId: string;
  contatos: ContatoEmpresa[];
}

export function PainelContatos({ empresaId, contatos }: Props) {
  const [adicionando, setAdicionando] = useState(false);
  const criar = useCriarContato(empresaId);
  const remover = useRemoverContato(empresaId);

  const form = useForm<CriarContatoEmpresaEntrada>({
    resolver: zodResolver(criarContatoEmpresaSchema),
    defaultValues: { principal: false },
  });

  async function aoSalvar(dados: CriarContatoEmpresaEntrada) {
    await criar.mutateAsync(dados);
    form.reset({ principal: false });
    setAdicionando(false);
  }

  async function aoRemover(contato: ContatoEmpresa) {
    if (!confirm(`Remover o contato "${contato.nome}"?`)) return;
    await remover.mutateAsync(contato.id);
  }

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Contatos</h2>
        {!adicionando && (
          <Botao variante="contorno" tamanho="sm" onClick={() => setAdicionando(true)}>
            + Adicionar
          </Botao>
        )}
      </div>

      {contatos.length === 0 && !adicionando && (
        <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
      )}

      <ul className="space-y-2">
        {contatos.map((contato) => (
          <li
            key={contato.id}
            className="flex items-start justify-between gap-2 rounded-md border bg-background px-3 py-2"
          >
            <div className="text-sm">
              <div className="font-medium">
                {contato.nome}
                {contato.principal && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    principal
                  </span>
                )}
              </div>
              {contato.cargo && (
                <div className="text-xs text-muted-foreground">{contato.cargo}</div>
              )}
              <div className="text-xs text-muted-foreground">
                {contato.email}
                {contato.email && contato.telefone && ' · '}
                {contato.telefone}
              </div>
            </div>
            <button
              type="button"
              onClick={() => aoRemover(contato)}
              className="text-xs text-destructive hover:underline"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>

      {adicionando && (
        <form onSubmit={form.handleSubmit(aoSalvar)} className="space-y-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              {...form.register('nome')}
              placeholder="Nome"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              {...form.register('cargo')}
              placeholder="Cargo"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              {...form.register('email')}
              placeholder="E-mail"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              {...form.register('telefone')}
              placeholder="Telefone (DDD + número)"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('principal')} />
            Marcar como contato principal
          </label>
          {(form.formState.errors.nome ||
            form.formState.errors.email ||
            form.formState.errors.telefone) && (
            <p className="text-xs text-destructive">
              {form.formState.errors.nome?.message ??
                form.formState.errors.email?.message ??
                form.formState.errors.telefone?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Botao
              type="button"
              variante="fantasma"
              tamanho="sm"
              onClick={() => {
                form.reset();
                setAdicionando(false);
              }}
            >
              Cancelar
            </Botao>
            <Botao type="submit" tamanho="sm" disabled={criar.isPending}>
              {criar.isPending ? 'Salvando...' : 'Salvar contato'}
            </Botao>
          </div>
        </form>
      )}
    </section>
  );
}
