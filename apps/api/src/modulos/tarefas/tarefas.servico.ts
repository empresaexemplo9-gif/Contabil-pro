import { Injectable, NotFoundException } from '@nestjs/common';


import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';
import { DispatcherAutomacoes } from '../automacoes/dispatcher.servico';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type {
  AtualizarTarefaEntrada,
  BuscarTarefas,
  CriarTarefaEntrada,
} from '@contabilpro/contracts';
import type { Prisma } from '@contabilpro/database';

@Injectable()
export class TarefasServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaServico,
    private readonly dispatcher: DispatcherAutomacoes,
  ) {}

  async listar(escritorioId: string, filtros: BuscarTarefas) {
    const where: Prisma.TarefaWhereInput = { escritorioId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.prioridade) where.prioridade = filtros.prioridade;
    if (filtros.empresaId) where.empresaId = filtros.empresaId;
    if (filtros.responsavelId) where.responsavelId = filtros.responsavelId;
    if (filtros.modeloId) where.modeloId = filtros.modeloId;
    if (filtros.termo) {
      where.OR = [
        { titulo: { contains: filtros.termo, mode: 'insensitive' } },
        { descricao: { contains: filtros.termo, mode: 'insensitive' } },
      ];
    }
    if (filtros.vencendoEm) {
      const limite = new Date();
      limite.setDate(limite.getDate() + filtros.vencendoEm);
      where.dataVencimento = { lte: limite };
      where.status = { in: ['PENDENTE', 'EM_ANDAMENTO', 'ATRASADA'] };
    }

    const [itens, total] = await Promise.all([
      this.prisma.tarefa.findMany({
        where,
        orderBy: { [filtros.ordenarPor]: filtros.ordem },
        skip: (filtros.pagina - 1) * filtros.tamanho,
        take: filtros.tamanho,
        include: {
          empresa: { select: { id: true, razaoSocial: true } },
          modelo: { select: { id: true, nome: true } },
          responsavel: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.tarefa.count({ where }),
    ]);

    return { itens, total, pagina: filtros.pagina, tamanho: filtros.tamanho };
  }

  async obter(escritorioId: string, id: string) {
    const tarefa = await this.prisma.tarefa.findFirst({
      where: { id, escritorioId },
      include: {
        empresa: { select: { id: true, razaoSocial: true } },
        modelo: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true, email: true } },
      },
    });
    if (!tarefa) throw new NotFoundException('Tarefa não encontrada');
    return tarefa;
  }

  async metricas(escritorioId: string) {
    const agora = new Date();
    const fimDia = new Date(agora);
    fimDia.setHours(23, 59, 59, 999);
    const em7Dias = new Date(agora);
    em7Dias.setDate(em7Dias.getDate() + 7);

    const [pendentes, emAndamento, atrasadas, vencemHoje, proximos7Dias, concluidasMes] =
      await Promise.all([
        this.prisma.tarefa.count({ where: { escritorioId, status: 'PENDENTE' } }),
        this.prisma.tarefa.count({ where: { escritorioId, status: 'EM_ANDAMENTO' } }),
        this.prisma.tarefa.count({ where: { escritorioId, status: 'ATRASADA' } }),
        this.prisma.tarefa.count({
          where: {
            escritorioId,
            status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
            dataVencimento: { lte: fimDia, gte: new Date(agora.setHours(0, 0, 0, 0)) },
          },
        }),
        this.prisma.tarefa.count({
          where: {
            escritorioId,
            status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
            dataVencimento: { lte: em7Dias },
          },
        }),
        this.prisma.tarefa.count({
          where: {
            escritorioId,
            status: 'CONCLUIDA',
            concluidaEm: { gte: new Date(new Date().setDate(1)) },
          },
        }),
      ]);

    return { pendentes, emAndamento, atrasadas, vencemHoje, proximos7Dias, concluidasMes };
  }

  async criar(usuario: UsuarioAutenticado, dados: CriarTarefaEntrada) {
    const tarefa = await this.prisma.tarefa.create({
      data: {
        escritorioId: usuario.escritorioId,
        empresaId: dados.empresaId ?? null,
        modeloId: dados.modeloId ?? null,
        titulo: dados.titulo,
        descricao: dados.descricao ?? null,
        prioridade: dados.prioridade,
        dataVencimento: dados.dataVencimento,
        responsavelId: dados.responsavelId ?? null,
      },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'tarefa.criada',
      entidade: 'Tarefa',
      entidadeId: tarefa.id,
    });
    await this.dispatcher.disparar({
      tipo: 'TAREFA_CRIADA',
      escritorioId: usuario.escritorioId,
      payload: { tarefa: serializarTarefa(tarefa) },
    });
    return tarefa;
  }

  async atualizar(usuario: UsuarioAutenticado, id: string, dados: AtualizarTarefaEntrada) {
    const existente = await this.prisma.tarefa.findFirst({
      where: { id, escritorioId: usuario.escritorioId },
    });
    if (!existente) throw new NotFoundException('Tarefa não encontrada');

    const concluiAgora = dados.status === 'CONCLUIDA' && existente.status !== 'CONCLUIDA';
    const concluidaEm = concluiAgora
      ? new Date()
      : dados.status && dados.status !== 'CONCLUIDA'
        ? null
        : undefined;

    const tarefa = await this.prisma.tarefa.update({
      where: { id },
      data: { ...dados, concluidaEm },
    });

    if (dados.status && dados.status !== existente.status) {
      await this.auditoria.registrar({
        escritorioId: usuario.escritorioId,
        atorId: usuario.id,
        acao: 'tarefa.status_alterado',
        entidade: 'Tarefa',
        entidadeId: id,
        diff: { de: existente.status, para: dados.status },
      });
    }

    if (concluiAgora) {
      await this.dispatcher.disparar({
        tipo: 'TAREFA_CONCLUIDA',
        escritorioId: usuario.escritorioId,
        payload: { tarefa: serializarTarefa(tarefa) },
      });
    }
    return tarefa;
  }
}

function serializarTarefa(t: {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  dataVencimento: Date;
  responsavelId: string | null;
  empresaId: string | null;
}) {
  return {
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    status: t.status,
    prioridade: t.prioridade,
    dataVencimento: t.dataVencimento.toISOString(),
    responsavelId: t.responsavelId,
    empresaId: t.empresaId,
  };
}
