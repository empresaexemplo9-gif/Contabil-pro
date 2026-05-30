import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface Usuario {
  nome: string;
  email: string;
}

interface AutenticacaoContextValor {
  usuario: Usuario | null;
  autenticado: boolean;
  entrar: (email: string) => void;
  sair: () => void;
}

const AutenticacaoContext = createContext<AutenticacaoContextValor | null>(null);

export function AutenticacaoProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Protótipo: login fictício. A integração real usaria a API ContabilPro/ViajeBrasil.
  const entrar = useCallback((email: string) => {
    const nome = email.split('@')[0] ?? 'Viajante';
    setUsuario({ nome, email });
  }, []);

  const sair = useCallback(() => setUsuario(null), []);

  const valor = useMemo(
    () => ({ usuario, autenticado: usuario !== null, entrar, sair }),
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
