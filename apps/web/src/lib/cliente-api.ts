const URL_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

class ErroApi extends Error {
  constructor(
    public status: number,
    public corpo: unknown,
  ) {
    super(`API ${status}`);
  }
}

async function executar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token-acesso') : null;
  const cabecalhos = new Headers(init.headers);
  cabecalhos.set('Content-Type', 'application/json');
  if (token) cabecalhos.set('Authorization', `Bearer ${token}`);

  const resposta = await fetch(`${URL_API}/api/v1${caminho}`, { ...init, headers: cabecalhos });
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new ErroApi(resposta.status, corpo);
  }
  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

export const clienteApi = {
  get: <T>(caminho: string) => executar<T>(caminho),
  post: <T>(caminho: string, corpo: unknown) =>
    executar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo) }),
  patch: <T>(caminho: string, corpo: unknown) =>
    executar<T>(caminho, { method: 'PATCH', body: JSON.stringify(corpo) }),
  delete: <T>(caminho: string) => executar<T>(caminho, { method: 'DELETE' }),
};

export { ErroApi };
