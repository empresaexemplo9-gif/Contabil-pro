'use client';

import { Copy, MoreVertical, UserPlus } from 'lucide-react';
import { useState } from 'react';

import {
  useAlterarPapel,
  useCriarUsuario,
  useDesativarUsuario,
  useEquipe,
  usePapeisPermissoes,
  type MembroEquipe,
  type NovoUsuarioSaida,
} from '@/lib/hooks-configuracoes';
import { useEmpresas } from '@/lib/hooks-empresas';
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

type Papel = 'PROPRIETARIO' | 'ADMIN' | 'CONTADOR' | 'ASSISTENTE' | 'CLIENTE';

export function AbaEquipe() {
  const equipe = useEquipe();
  const rbac = usePapeisPermissoes();
  const [convidarAberto, setConvidarAberto] = useState(false);
  const [resultadoCriacao, setResultadoCriacao] = useState<NovoUsuarioSaida | null>(null);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <div>
            <h2 className="font-medium">Membros</h2>
            <p className="text-xs text-muted-foreground">
              Equipe interna do escritório e clientes vinculados.
            </p>
          </div>
          <button
            onClick={() => setConvidarAberto(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            Convidar usuário
          </button>
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
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">E-mail</th>
                  <th className="px-4 py-2">Papel</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Desde</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {equipe.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Nenhum membro cadastrado.
                    </td>
                  </tr>
                )}
                {equipe.data.map((m) => (
                  <LinhaMembro key={m.id} membro={m} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          O ContábilPro não tem cadastro público — somente
          <span className="mx-1 font-semibold text-foreground">PROPRIETÁRIO</span>e
          <span className="mx-1 font-semibold text-foreground">ADMIN</span>
          podem convidar membros e vincular clientes finais.
        </footer>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
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
              <ul className="grid grid-cols-1 gap-1 font-mono text-xs">
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

      {convidarAberto && (
        <ModalConvidar
          aoFechar={() => setConvidarAberto(false)}
          aoCriar={(r) => {
            setConvidarAberto(false);
            if (r.senhaTemporaria) setResultadoCriacao(r);
          }}
        />
      )}

      {resultadoCriacao && (
        <ModalSenhaGerada
          resultado={resultadoCriacao}
          aoFechar={() => setResultadoCriacao(null)}
        />
      )}
    </div>
  );
}

function LinhaMembro({ membro }: { membro: MembroEquipe }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const alterar = useAlterarPapel();
  const desativar = useDesativarUsuario();

  function mudarPapel(novo: Papel) {
    alterar.mutate({
      usuarioId: membro.usuario.id,
      papel: novo,
      empresaId: novo === 'CLIENTE' ? membro.empresaId ?? undefined : null,
    });
    setMenuAberto(false);
  }

  function remover() {
    if (confirm(`Remover ${membro.usuario.nome} do escritório?`)) {
      desativar.mutate(membro.usuario.id);
    }
    setMenuAberto(false);
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-medium">{membro.usuario.nome}</td>
      <td className="px-4 py-2 text-muted-foreground">{membro.usuario.email}</td>
      <td className="px-4 py-2">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {ROTULO_PAPEL[membro.papel] ?? membro.papel}
        </span>
      </td>
      <td className="px-4 py-2">
        {ROTULO_STATUS[membro.usuario.status] ?? membro.usuario.status}
      </td>
      <td className="px-4 py-2 text-muted-foreground">{formatarData(membro.criadoEm)}</td>
      <td className="px-4 py-2 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Ações"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuAberto && (
            <div
              className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-border bg-popover text-sm shadow-card-soft"
              onMouseLeave={() => setMenuAberto(false)}
            >
              <div className="border-b border-border px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Alterar papel
              </div>
              {(['ADMIN', 'CONTADOR', 'ASSISTENTE'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => mudarPapel(p)}
                  disabled={membro.papel === p}
                  className="block w-full px-3 py-1.5 text-left hover:bg-muted disabled:opacity-50"
                >
                  {ROTULO_PAPEL[p]}
                </button>
              ))}
              <button
                onClick={remover}
                className="block w-full border-t border-border px-3 py-1.5 text-left text-destructive hover:bg-muted"
              >
                Remover
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function ModalConvidar({
  aoFechar,
  aoCriar,
}: {
  aoFechar: () => void;
  aoCriar: (r: NovoUsuarioSaida) => void;
}) {
  const criar = useCriarUsuario();
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState<Papel>('CONTADOR');
  const [empresaId, setEmpresaId] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);

  const empresas = useEmpresas({ pagina: 1, tamanho: 100, ordem: 'asc' });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (papel === 'CLIENTE' && !empresaId) {
      setErro('Selecione a empresa que este cliente representa.');
      return;
    }
    try {
      const r = await criar.mutateAsync({
        email: email.trim(),
        nome: nome.trim(),
        papel,
        empresaId: papel === 'CLIENTE' ? empresaId : undefined,
      });
      aoCriar(r);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao criar usuário.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-md space-y-3 rounded-lg bg-card p-5 shadow-card-soft"
      >
        <div>
          <h3 className="text-lg font-semibold">Convidar usuário</h3>
          <p className="text-xs text-muted-foreground">
            Geramos uma senha temporária. Compartilhe com o convidado por canal seguro;
            ele deve trocá-la no primeiro acesso.
          </p>
        </div>

        <label className="block text-sm">
          <span className="text-muted-foreground">Nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            placeholder="usuario@escritorio.com"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Papel</span>
          <select
            value={papel}
            onChange={(e) => setPapel(e.target.value as Papel)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="ADMIN">Admin</option>
            <option value="CONTADOR">Contador</option>
            <option value="ASSISTENTE">Assistente</option>
            <option value="CLIENTE">Cliente (acesso ao Portal)</option>
          </select>
        </label>

        {papel === 'CLIENTE' && (
          <label className="block text-sm">
            <span className="text-muted-foreground">Empresa vinculada</span>
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">Selecione…</option>
              {empresas.data?.itens.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.razaoSocial}
                </option>
              ))}
            </select>
          </label>
        )}

        {erro && (
          <p className="rounded-md bg-destructive/10 px-2 py-1 text-sm text-destructive">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={criar.isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {criar.isPending ? 'Criando…' : 'Convidar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalSenhaGerada({
  resultado,
  aoFechar,
}: {
  resultado: NovoUsuarioSaida;
  aoFechar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(resultado.senhaTemporaria ?? '');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-md space-y-3 rounded-lg bg-card p-5 shadow-card-soft">
        <h3 className="text-lg font-semibold">Usuário criado</h3>
        <p className="text-sm text-muted-foreground">
          <strong>{resultado.nome}</strong> ({resultado.email}) foi convidado(a). Compartilhe a
          senha temporária abaixo por canal seguro — ela <em>não</em> será exibida novamente.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
          <code className="flex-1 break-all font-mono text-sm">
            {resultado.senhaTemporaria}
          </code>
          <button
            onClick={copiar}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted"
          >
            <Copy className="h-3 w-3" />
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={aoFechar}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
