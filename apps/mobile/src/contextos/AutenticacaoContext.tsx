import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Papel = 'admin' | 'cliente';

interface Usuario {
  nome: string;
  email: string;
  papel: Papel;
}

interface AutenticacaoContextValor {
  usuario: Usuario | null;
  autenticado: boolean;
  ehAdmin: boolean;
  entrar: (email: string, papel?: Papel) => void;
  sair: () => void;
}

const AutenticacaoContext = createContext<AutenticacaoContextValor | null>(null);

/** No protótipo, contas cujo e-mail começa com "admin" entram como administrador. */
function papelPorEmail(email: string): Papel {
  return email.trim().toLowerCase().startsWith('admin') ? 'admin' : 'cliente';
}

export function AutenticacaoProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const entrar = useCallback((email: string, papel?: Papel) => {
    const nome = email.split('@')[0] ?? 'Viajante';
    setUsuario({ nome, email, papel: papel ?? papelPorEmail(email) });
  }, []);

  const sair = useCallback(() => setUsuario(null), []);

  const valor = useMemo(
    () => ({
      usuario,
      autenticado: usuario !== null,
      ehAdmin: usuario?.papel === 'admin',
      entrar,
      sair,
    }),
    [usuario, entrar, sair],
  );

  return (
    <AutenticacaoContext.Provider value={valor}>{children}</AutenticacaoContext.Provider>
  );
}

export function useAutenticacao() {
  const ctx = useContext(AutenticacaoContext);
  if (!ctx) throw new Error('useAutenticacao deve ser usado dentro de AutenticacaoProvider');
  return ctx;
}
