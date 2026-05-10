'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    } catch (e) {
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
        <h1 className="text-2xl font-semibold">Entrar no ContábilPro</h1>
        <label className="block text-sm">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            required
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
          />
        </label>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Botao type="submit" disabled={carregando} className="w-full">
          {carregando ? 'Entrando...' : 'Entrar'}
        </Botao>
      </form>
    </main>
  );
}
