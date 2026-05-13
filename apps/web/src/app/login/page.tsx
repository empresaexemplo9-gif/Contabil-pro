'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BotaoGoogle } from '@/components/botao-google';
import { clienteApi } from '@/lib/cliente-api';
import { usarLojaAuth } from '@/lib/loja-auth';
import { Botao } from '@contabilpro/ui';
import type { LoginSaida } from '@contabilpro/contracts';

export default function PaginaLogin() {
  const roteador = useRouter();
  const definirTokens = usarLojaAuth((s) => s.definirTokens);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const dados = await clienteApi.post<LoginSaida>('/auth/login', { email, senha });
      if (dados.exigeMfa) {
        setErro('MFA exigido — fluxo a implementar.');
        return;
      }
      definirTokens(dados.tokenAcesso, dados.tokenRefresh);
      roteador.push('/painel');
    } catch {
      setErro('Credenciais inválidas');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-card-soft">
        <div>
          <h1 className="text-2xl font-semibold">
            Contábil<span className="text-primary">Pro</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso do escritório.</p>
        </div>

        <BotaoGoogle audiencia="escritorio" />

        <Separador />

        <form onSubmit={aoEnviar} className="space-y-3">
          <label className="block text-sm">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              required
              autoComplete="username"
            />
          </label>
          <label className="block text-sm">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              required
              autoComplete="current-password"
            />
          </label>
          {erro && (
            <p className="rounded-md bg-destructive/10 px-2 py-1 text-sm text-destructive">
              {erro}
            </p>
          )}
          <Botao type="submit" disabled={carregando} className="w-full">
            {carregando ? 'Entrando…' : 'Entrar'}
          </Botao>
        </form>
      </div>
    </main>
  );
}

function Separador() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      ou
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
