'use client';

import { useEquipe, usePapeisPermissoes } from '@/lib/hooks-configuracoes';
import { formatarData } from '@/lib/formatadores';

const ROTULO_PAPEL: Record<string, string> = {
  PROPRIETARIO: 'Proprietário',
  ADMIN: 'Admin',
  CONTADOR: 'Contador',
  ASSISTENTE: 'Assistente',
  CLIENTE: 'Cliente',
};

const ROTULO_STATUS: Record<string, string> = {
  ATIVO: 'Ativo',
  CONVIDADO: 'Convidado',
  SUSPENSO: 'Suspenso',
  REMOVIDO: 'Removido',
};

export function AbaEquipe() {
  const equipe = useEquipe();
  const rbac = usePapeisPermissoes();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card">
        <header className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-medium">Membros</h2>
            <p className="text-xs text-muted-foreground">
              Equipe interna do escritório e clientes vinculados.
            </p>
          </div>
        </header>

        {equipe.isLoading && (
          <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
        )}
        {equipe.error && (
          <p className="p-4 text-sm text-destructive">Falha ao carregar equipe.</p>
        )}
        {equipe.data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">E-mail</th>
                  <th className="px-4 py-2">Papel</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Vínculo desde</th>
                </tr>
              </thead>
              <tbody>
                {equipe.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Nenhum membro cadastrado.
                    </td>
                  </tr>
                )}
                {equipe.data.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{m.usuario.nome}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.usuario.email}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-md bg-accent px-2 py-0.5 text-xs">
                        {ROTULO_PAPEL[m.papel] ?? m.papel}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {ROTULO_STATUS[m.usuario.status] ?? m.usuario.status}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatarData(m.criadoEm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 font-medium">Papéis e permissões</h2>
        {rbac.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {rbac.data && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Papéis disponíveis
              </h3>
              <ul className="space-y-1 text-sm">
                {rbac.data.papeis.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    {ROTULO_PAPEL[p] ?? p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Permissões
              </h3>
              <ul className="grid grid-cols-1 gap-1 text-xs font-mono">
                {rbac.data.permissoes.map((p) => (
                  <li key={p} className="rounded bg-muted/40 px-2 py-1">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
