'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function AlternadorTema() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  if (!montado) {
    return <div className="h-9 w-9 rounded-md" aria-hidden />;
  }

  const atual = theme ?? 'system';

  function alternar() {
    if (atual === 'light') setTheme('dark');
    else if (atual === 'dark') setTheme('system');
    else setTheme('light');
  }

  const Icone = atual === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const rotulo =
    atual === 'system'
      ? 'Tema do sistema'
      : resolvedTheme === 'dark'
        ? 'Tema escuro'
        : 'Tema claro';

  return (
    <button
      onClick={alternar}
      title={rotulo}
      aria-label={rotulo}
      className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Icone className="h-4 w-4" />
    </button>
  );
}
