'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BotaoGoogle } from '@/components/botao-google';
import { clienteApi } from '@/lib/cliente-api';
import { usarLojaAuth } from '@/lib/loja-auth';
import type { LoginSaida } from '@contabilpro/contracts';

export default function PaginaLoginCliente() {
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
        setErro('Autenticação em dois fatores exigida.');
        return;
      }
      definirTokens(dados.tokenAcesso, dados.tokenRefresh);
      roteador.replace('/portal-cliente');
    } catch {
      setErro('Credenciais inválidas');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={aoEnviar}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold">Portal do Cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse documentos, obrigações e fale com seu escritório.
          </p>
        </div>

        <BotaoGoogle audiencia="portal-cliente" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          ou
          <div className="h-px flex-1 bg-border" />
        </div>

        <label className="block text-sm">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
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
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            required
            autoComplete="current-password"
          />
        </label>
        {erro && (
          <p className="rounded-md bg-destructive/10 px-2 py-1 text-sm text-destructive">{erro}</p>
        )}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
