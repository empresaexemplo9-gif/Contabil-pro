import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';

@Injectable()
export class AtendimentoServico {
  constructor(private readonly prisma: PrismaService) {}

  listarConversas(escritorioId: string) {
    return this.prisma.conversa.findMany({
      where: { escritorioId },
      orderBy: { ultimaMensagemEm: 'desc' },
      include: { empresa: { select: { id: true, razaoSocial: true } } },
    });
  }

  async obterConversa(escritorioId: string, id: string) {
    const conversa = await this.prisma.conversa.findFirst({
      where: { id, escritorioId },
      include: { mensagens: { orderBy: { criadoEm: 'asc' } } },
    });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');
    return conversa;
  }

  async enviarMensagem(usuario: UsuarioAutenticado, conversaId: string, texto: string) {
    await this.obterConversa(usuario.escritorioId, conversaId);
    const mensagem = await this.prisma.mensagem.create({
      data: { conversaId, remetenteId: usuario.id, corpo: texto },
    });
    await this.prisma.conversa.update({
      where: { id: conversaId },
      data: { ultimaMensagemEm: new Date(), status: 'EM_ATENDIMENTO' },
    });
    return mensagem;
  }
}
