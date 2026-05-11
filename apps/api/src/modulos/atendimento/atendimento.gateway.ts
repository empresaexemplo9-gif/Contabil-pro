import { verificarTokenAcesso } from '@contabilpro/auth-core';
import { eventosSocket } from '@contabilpro/contracts';
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { configurarEnv } from '../../config/env';

import type { Server, Socket } from 'socket.io';



interface DadosSocket {
  usuarioId: string;
  escritorioId: string;
}

function salaEscritorio(escritorioId: string): string {
  return `escritorio:${escritorioId}`;
}

function salaConversa(conversaId: string): string {
  return `conversa:${conversaId}`;
}

@WebSocketGateway({
  namespace: '/atendimento',
  cors: { origin: process.env.CORS_ORIGINS?.split(',') ?? '*' },
})
export class AtendimentoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  servidor!: Server;

  private readonly logger = new Logger(AtendimentoGateway.name);

  async handleConnection(cliente: Socket): Promise<void> {
    const token =
      (cliente.handshake.auth?.token as string | undefined) ??
      (cliente.handshake.headers.authorization?.replace(/^Bearer\s+/, '') as string | undefined);

    if (!token) {
      this.logger.warn(`socket sem token rejeitado (${cliente.id})`);
      cliente.disconnect(true);
      return;
    }

    try {
      const env = configurarEnv();
      const payload = await verificarTokenAcesso(token, env.JWT_PUBLIC_KEY);
      const dados: DadosSocket = {
        usuarioId: payload.sub,
        escritorioId: payload.escritorioId,
      };
      cliente.data = dados;
      await cliente.join(salaEscritorio(dados.escritorioId));
      cliente.emit('conectado', { ok: true, escritorioId: dados.escritorioId });
    } catch {
      this.logger.warn(`token de socket inválido (${cliente.id})`);
      cliente.disconnect(true);
    }
  }

  handleDisconnect(_cliente: Socket): void {}

  @SubscribeMessage('conversa.entrar')
  async aoEntrarConversa(cliente: Socket, payload: { conversaId: string }): Promise<void> {
    if (!cliente.data?.escritorioId || !payload?.conversaId) return;
    await cliente.join(salaConversa(payload.conversaId));
  }

  @SubscribeMessage('conversa.sair')
  async aoSairConversa(cliente: Socket, payload: { conversaId: string }): Promise<void> {
    if (!payload?.conversaId) return;
    await cliente.leave(salaConversa(payload.conversaId));
  }

  broadcastMensagemNova(escritorioId: string, conversaId: string, mensagem: unknown): void {
    this.servidor.to(salaConversa(conversaId)).emit(eventosSocket.mensagemNova, mensagem);
    // Também avisa a sala do escritório para refrescar a lista de conversas.
    this.servidor
      .to(salaEscritorio(escritorioId))
      .emit(eventosSocket.conversaAtualizada, { conversaId });
  }

  broadcastConversaAtualizada(escritorioId: string, conversaId: string): void {
    this.servidor
      .to(salaEscritorio(escritorioId))
      .emit(eventosSocket.conversaAtualizada, { conversaId });
  }
}
