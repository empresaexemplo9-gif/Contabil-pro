'use client';

import { Menu, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { AlternadorTema } from './alternador-tema';
import { MenuUsuario } from './menu-usuario';
import { SinoNotificacoes } from './sino-notificacoes';

export function Topbar({ aoAbrirMenu }: { aoAbrirMenu?: () => void }) {
  const roteador = useRouter();
  const [busca, setBusca] = useState('');

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    const termo = busca.trim();
    if (!termo) return;
    roteador.push(`/painel/empresas?termo=${encodeURIComponent(termo)}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
      {aoAbrirMenu && (
        <button
          onClick={aoAbrirMenu}
          aria-label="Abrir menu"
          className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}

      <form onSubmit={pesquisar} className="relative hidden flex-1 sm:block sm:max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar empresas, documentos, tarefas…"
          className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <AlternadorTema />
        <SinoNotificacoes />
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <MenuUsuario />
      </div>
    </header>
  );
}
