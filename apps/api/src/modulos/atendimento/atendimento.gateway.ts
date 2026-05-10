import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/atendimento', cors: { origin: '*' } })
export class AtendimentoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  servidor!: Server;

  handleConnection(cliente: Socket): void {
    // TODO: validar JWT do socket via handshake e ingressar em sala do escritorio
    cliente.emit('conectado', { ok: true });
  }

  handleDisconnect(_: Socket): void {}

  emitirMensagemNova(conversaId: string, mensagem: unknown): void {
    this.servidor.to(`conversa:${conversaId}`).emit('mensagem.nova', mensagem);
  }
}
