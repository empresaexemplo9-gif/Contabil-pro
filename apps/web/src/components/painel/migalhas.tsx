'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROTULOS: Record<string, string> = {
  painel: 'Dashboard',
  empresas: 'Empresas',
  nova: 'Nova',
  documentos: 'Documentos',
  novo: 'Novo',
  tarefas: 'Tarefas',
  obrigacoes: 'Obrigações',
  atendimento: 'Atendimento',
  automacoes: 'Automações',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
};

export function Migalhas() {
  const caminho = usePathname() ?? '';
  const partes = caminho.split('/').filter(Boolean);
  if (partes.length <= 1) return null;

  let acumulado = '';
  const itens = partes.map((parte, idx) => {
    acumulado += `/${parte}`;
    const ultimo = idx === partes.length - 1;
    const rotulo = ROTULOS[parte] ?? humanizar(parte);
    return { href: acumulado, rotulo, ultimo };
  });

  return (
    <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/painel" className="flex items-center hover:text-foreground">
        <Home className="h-3 w-3" />
      </Link>
      {itens.slice(1).map((item) => (
        <span key={item.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-60" />
          {item.ultimo ? (
            <span className="font-medium text-foreground">{item.rotulo}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground">
              {item.rotulo}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function humanizar(slug: string): string {
  if (slug.length <= 12 && /^[a-z0-9]+$/.test(slug)) {
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }
  return '…';
}
