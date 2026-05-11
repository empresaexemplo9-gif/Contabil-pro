'use client';

import { io, Socket } from 'socket.io-client';

const URL_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

let instancia: Socket | null = null;

export function obterSocketAtendimento(): Socket {
  if (instancia && instancia.connected) return instancia;
  if (instancia) {
    instancia.disconnect();
    instancia = null;
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('token-acesso') : null;
  instancia = io(`${URL_API}/atendimento`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });
  return instancia;
}

export function fecharSocketAtendimento(): void {
  if (instancia) {
    instancia.disconnect();
    instancia = null;
  }
}
