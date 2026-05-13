'use client';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  ListChecks,
  type LucideIcon,
  MessageSquare,
  Settings,
  Sparkles,
  Workflow,
  ClipboardList,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ItemMenu {
  href: string;
  titulo: string;
  icone: LucideIcon;
  exato?: boolean;
}

interface GrupoMenu {
  rotulo?: string;
  itens: ItemMenu[];
}

const GRUPOS: GrupoMenu[] = [
  {
    itens: [{ href: '/painel', titulo: 'Dashboard', icone: Gauge, exato: true }],
  },
  {
    rotulo: 'Operação',
    itens: [
      { href: '/painel/empresas', titulo: 'Empresas', icone: Building2 },
      { href: '/painel/documentos', titulo: 'Documentos', icone: FileText },
      { href: '/painel/tarefas', titulo: 'Tarefas', icone: ListChecks },
      { href: '/painel/obrigacoes', titulo: 'Obrigações', icone: ClipboardList },
    ],
  },
  {
    rotulo: 'Comunicação',
    itens: [
      { href: '/painel/atendimento', titulo: 'Atendimento', icone: MessageSquare },
      { href: '/painel/automacoes', titulo: 'Automações', icone: Workflow },
    ],
  },
  {
    rotulo: 'Análise',
    itens: [{ href: '/painel/relatorios', titulo: 'Relatórios', icone: PieChart }],
  },
  {
    rotulo: 'Sistema',
    itens: [{ href: '/painel/configuracoes', titulo: 'Configurações', icone: Settings }],
  },
];

const CHAVE_COLAPSADO = 'contabilpro:sidebar-colapsada';

export function BarraLateral() {
  const [colapsada, setColapsada] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_COLAPSADO);
    if (salvo === '1') setColapsada(true);
  }, []);

  function alternar() {
    setColapsada((c) => {
      const proximo = !c;
      localStorage.setItem(CHAVE_COLAPSADO, proximo ? '1' : '0');
      return proximo;
    });
  }

  return (
    <aside
      className={`hidden shrink-0 border-r border-border bg-card transition-[width] duration-200 md:flex md:flex-col ${
        colapsada ? 'w-16' : 'w-60'
      }`}
    >
      <ConteudoSidebar colapsada={colapsada}>
        <button
          onClick={alternar}
          aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {colapsada ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </ConteudoSidebar>
    </aside>
  );
}

export function SidebarMobile({ aoNavegar }: { aoNavegar: () => void }) {
  return (
    <div className="flex h-full flex-col bg-card">
      <ConteudoSidebar colapsada={false} aoNavegar={aoNavegar} />
    </div>
  );
}

function ConteudoSidebar({
  colapsada,
  children,
  aoNavegar,
}: {
  colapsada: boolean;
  children?: React.ReactNode;
  aoNavegar?: () => void;
}) {
  const caminho = usePathname();
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <Link
          href="/painel"
          onClick={aoNavegar}
          className="flex items-center gap-2 overflow-hidden"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-card-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          {!colapsada && (
            <span className="truncate text-sm font-semibold tracking-tight">
              Contábil<span className="text-primary">Pro</span>
            </span>
          )}
        </Link>
        {children}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {GRUPOS.map((grupo, idx) => (
          <div key={idx} className="px-2 pb-3 last:pb-0">
            {grupo.rotulo && !colapsada && (
              <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {grupo.rotulo}
              </div>
            )}
            <ul className="space-y-0.5">
              {grupo.itens.map((item) => (
                <ItemLink
                  key={item.href}
                  item={item}
                  ativo={ehAtivo(caminho, item)}
                  colapsada={colapsada}
                  aoNavegar={aoNavegar}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3 text-[10px] text-muted-foreground">
        {!colapsada && <span>v0.1 · ContábilPro</span>}
      </div>
    </>
  );
}

function ItemLink({
  item,
  ativo,
  colapsada,
  aoNavegar,
}: {
  item: ItemMenu;
  ativo: boolean;
  colapsada: boolean;
  aoNavegar?: () => void;
}) {
  const Icone = item.icone;
  return (
    <li>
      <Link
        href={item.href}
        onClick={aoNavegar}
        title={colapsada ? item.titulo : undefined}
        className={`group relative flex items-center gap-3 rounded-md px-2 py-2 text-sm transition ${
          ativo
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        } ${colapsada ? 'justify-center' : ''}`}
      >
        {ativo && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />
        )}
        <Icone
          className={`h-4 w-4 shrink-0 ${
            ativo ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          }`}
        />
        {!colapsada && <span className="truncate">{item.titulo}</span>}
      </Link>
    </li>
  );
}

function ehAtivo(caminho: string | null, item: ItemMenu): boolean {
  if (!caminho) return false;
  if (item.exato) return caminho === item.href;
  return caminho === item.href || caminho.startsWith(`${item.href}/`);
}
