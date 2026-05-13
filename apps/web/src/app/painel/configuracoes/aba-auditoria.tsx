'use client';

import { useState } from 'react';

import { useAcoesAuditoria, useAuditoria } from '@/lib/hooks-configuracoes';

const ROTULO_ENTIDADE: Record<string, string> = {
  Empresa: 'Empresa',
  Documento: 'Documento',
  Tarefa: 'Tarefa',
  Integracao: 'Integração',
  Automacao: 'Automação',
  Conversa: 'Conversa',
  Usuario: 'Usuário',
};

export function AbaAuditoria() {
  const [entidade, setEntidade] = useState<string>('');
  const [acao, setAcao] = useState<string>('');
  const [cursores, setCursores] = useState<string[]>([]);
  const [cursorAtual, setCursorAtual] = useState<string | undefined>();

  const acoes = useAcoesAuditoria();
  const consulta = useAuditoria({
    entidade: entidade || undefined,
    acao: acao || undefined,
    cursor: cursorAtual,
  });

  function avancar() {
    const proximo = consulta.data?.proximoCursor;
    if (!proximo) return;
    setCursores((prev) => [...prev, cursorAtual ?? '']);
    setCursorAtual(proximo);
  }

  function voltar() {
    const prev = [...cursores];
    const ultimo = prev.pop();
    setCursores(prev);
    setCursorAtual(ultimo || undefined);
  }

  function limparFiltros() {
    setEntidade('');
    setAcao('');
    setCursorAtual(undefined);
    setCursores([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <label className="text-sm">
          <span className="block text-xs text-muted-foreground">Entidade</span>
          <select
            value={entidade}
            onChange={(e) => {
              setEntidade(e.target.value);
              setCursorAtual(undefined);
              setCursores([]);
            }}
            className="mt-0.5 rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {Object.entries(ROTULO_ENTIDADE).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs text-muted-foreground">Ação</span>
          <select
            value={acao}
            onChange={(e) => {
              setAcao(e.target.value);
              setCursorAtual(undefined);
              setCursores([]);
            }}
            className="mt-0.5 rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {(acoes.data ?? []).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={limparFiltros}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Limpar
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Quando</th>
              <th className="px-3 py-2">Ator</th>
              <th className="px-3 py-2">Ação</th>
              <th className="px-3 py-2">Entidade</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {consulta.isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            )}
            {consulta.data?.itens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                  Nenhum log encontrado.
                </td>
              </tr>
            )}
            {consulta.data?.itens.map((log) => (
              <tr key={log.id} className="border-b last:border-0 align-top">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {new Date(log.criadoEm).toLocaleString('pt-BR')}
                </td>
                <td className="px-3 py-2">
                  {log.ator ? (
                    <>
                      <div className="font-medium">{log.ator.nome}</div>
                      <div className="text-xs text-muted-foreground">{log.ator.email}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">sistema</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{log.acao}</td>
                <td className="px-3 py-2">
                  <div>{ROTULO_ENTIDADE[log.entidade] ?? log.entidade}</div>
                  {log.entidadeId && (
                    <div className="text-xs text-muted-foreground">{log.entidadeId}</div>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {log.ip ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          onClick={voltar}
          disabled={cursores.length === 0}
          className="rounded-md border px-3 py-1 hover:bg-accent disabled:opacity-50"
        >
          ← Anterior
        </button>
        <span className="text-muted-foreground">Página {cursores.length + 1}</span>
        <button
          onClick={avancar}
          disabled={!consulta.data?.proximoCursor}
          className="rounded-md border px-3 py-1 hover:bg-accent disabled:opacity-50"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
