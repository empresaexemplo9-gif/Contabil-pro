/**
 * Serviços transacionais (reserva, pagamento e autenticação) — a brecha para
 * a integração futura. Hoje simulam sucesso localmente; ao ligar a API, troque
 * o corpo de cada função pela chamada `requisitar(...)` correspondente.
 *
 * Contrato de endpoints previsto:
 *   POST /reservas      { itens } -> { reservaId }
 *   POST /pagamentos    { reservaId, forma, dadosViajante } -> { status, comprovante }
 *   POST /auth/login    { email, senha } -> { token, usuario }
 */
import type { ItemReserva } from '../tipos';
import { API_CONFIG } from './config';
import { requisitar } from './cliente';

export type FormaPagamento = 'pix' | 'cartao' | 'boleto';

export interface DadosViajante {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

export interface Comprovante {
  reservaId: string;
  status: 'confirmado' | 'pendente';
}

/** Cria a reserva a partir dos itens do carrinho. */
export async function criarReserva(itens: ItemReserva[]): Promise<{ reservaId: string }> {
  if (API_CONFIG.fonte === 'api') {
    return requisitar<{ reservaId: string }>('/reservas', {
      method: 'POST',
      body: JSON.stringify({ itens }),
    });
  }
  // Mock: gera um identificador local.
  return { reservaId: `RSV-${Date.now()}` };
}

/** Processa o pagamento de uma reserva. */
export async function processarPagamento(args: {
  reservaId: string;
  forma: FormaPagamento;
  viajante?: Partial<DadosViajante>;
}): Promise<Comprovante> {
  if (API_CONFIG.fonte === 'api') {
    return requisitar<Comprovante>('/pagamentos', {
      method: 'POST',
      body: JSON.stringify(args),
    });
  }
  // Mock: simula latência de processamento e confirma.
  await new Promise((r) => setTimeout(r, 1200));
  return { reservaId: args.reservaId, status: 'confirmado' };
}

export interface SessaoUsuario {
  token: string;
  usuario: { nome: string; email: string };
}

/** Autentica por e-mail/senha. */
export async function autenticar(email: string, senha: string): Promise<SessaoUsuario> {
  if (API_CONFIG.fonte === 'api') {
    return requisitar<SessaoUsuario>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  }
  // Mock: aceita qualquer credencial.
  const nome = email.split('@')[0] ?? 'Viajante';
  return { token: 'mock-token', usuario: { nome, email } };
}
