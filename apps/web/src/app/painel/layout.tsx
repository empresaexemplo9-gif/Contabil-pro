import Link from 'next/link';
import type { ReactNode } from 'react';

const ITENS_MENU = [
  { href: '/painel', titulo: 'Dashboard' },
  { href: '/painel/empresas', titulo: 'Empresas' },
  { href: '/painel/documentos', titulo: 'Documentos' },
  { href: '/painel/tarefas', titulo: 'Tarefas' },
  { href: '/painel/atendimento', titulo: 'Atendimento' },
  { href: '/painel/automacoes', titulo: 'Automações' },
  { href: '/painel/relatorios', titulo: 'Relatórios' },
  { href: '/painel/configuracoes', titulo: 'Configurações' },
] as const;

export default function LayoutPainel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r bg-card p-4 md:block">
        <div className="mb-6 text-xl font-semibold">ContábilPro</div>
        <nav className="flex flex-col gap-1">
          {ITENS_MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {item.titulo}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
