import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';


import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';

import type { UsuarioAutenticado } from '../../comum/decoradores/usuario-atual.decorador';
import type {
  AtualizarModeloObrigacaoEntrada,
  CriarModeloObrigacaoEntrada,
  GerarTarefasEntrada,
} from '@contabilpro/contracts';

@Injectable()
export class ObrigacoesServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaServico,
  ) {}

  listarModelos(escritorioId: string, incluirInativos = false) {
    return this.prisma.modeloObrigacao.findMany({
      where: { escritorioId, ...(incluirInativos ? {} : { ativo: true }) },
      orderBy: { nome: 'asc' },
    });
  }

  async obterModelo(escritorioId: string, id: string) {
    const modelo = await this.prisma.modeloObrigacao.findFirst({
      where: { id, escritorioId },
    });
    if (!modelo) throw new NotFoundException('Modelo de obrigação não encontrado');
    return modelo;
  }

  async criarModelo(usuario: UsuarioAutenticado, dados: CriarModeloObrigacaoEntrada) {
    if (dados.frequencia !== 'UNICA' && !dados.diaVencimento) {
      throw new ConflictException('Frequência recorrente exige diaVencimento');
    }
    const modelo = await this.prisma.modeloObrigacao.create({
      data: {
        escritorioId: usuario.escritorioId,
        nome: dados.nome,
        descricao: dados.descricao ?? null,
        frequencia: dados.frequencia,
        diaVencimento: dados.diaVencimento ?? null,
        regimes: dados.regimes,
        ativo: dados.ativo,
      },
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'obrigacao_modelo.criado',
      entidade: 'ModeloObrigacao',
      entidadeId: modelo.id,
    });
    return modelo;
  }

  async atualizarModelo(
    usuario: UsuarioAutenticado,
    id: string,
    dados: AtualizarModeloObrigacaoEntrada,
  ) {
    await this.obterModelo(usuario.escritorioId, id);
    const modelo = await this.prisma.modeloObrigacao.update({
      where: { id },
      data: dados,
    });
    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'obrigacao_modelo.atualizado',
      entidade: 'ModeloObrigacao',
      entidadeId: id,
    });
    return modelo;
  }

  async desativarModelo(usuario: UsuarioAutenticado, id: string) {
    await this.obterModelo(usuario.escritorioId, id);
    await this.prisma.modeloObrigacao.update({
      where: { id },
      data: { ativo: false },
    });
    return { ok: true };
  }

  /**
   * Gera tarefas para um modelo específico, para cada empresa ativa cujo
   * regime esteja na lista do modelo (ou todas, se a lista for vazia).
   * Idempotente: usa modeloId + empresaId + dataVencimento como chave lógica
   * — empresas já com tarefa para essa data não recebem duplicata.
   */
  async gerarTarefas(
    usuario: UsuarioAutenticado,
    modeloId: string,
    dados: GerarTarefasEntrada,
  ): Promise<{ geradas: number; ignoradas: number; total: number }> {
    const modelo = await this.obterModelo(usuario.escritorioId, modeloId);
    if (!modelo.ativo) throw new ConflictException('Modelo inativo');
    if (!modelo.diaVencimento) {
      throw new ConflictException('Modelo sem diaVencimento — gere a tarefa manualmente');
    }

    const dataVencimento = calcularVencimento(dados.ano, dados.mes, modelo.diaVencimento);

    const empresas = await this.prisma.empresa.findMany({
      where: {
        escritorioId: usuario.escritorioId,
        status: 'ATIVA',
        ...(modelo.regimes.length > 0 ? { regime: { in: modelo.regimes } } : {}),
      },
      select: { id: true, razaoSocial: true },
    });

    let geradas = 0;
    let ignoradas = 0;

    for (const empresa of empresas) {
      const existente = await this.prisma.tarefa.findFirst({
        where: {
          escritorioId: usuario.escritorioId,
          modeloId,
          empresaId: empresa.id,
          dataVencimento,
        },
        select: { id: true },
      });
      if (existente) {
        ignoradas += 1;
        continue;
      }
      await this.prisma.tarefa.create({
        data: {
          escritorioId: usuario.escritorioId,
          empresaId: empresa.id,
          modeloId,
          titulo: `${modelo.nome} — ${empresa.razaoSocial}`,
          descricao: modelo.descricao,
          prioridade: dados.prioridade,
          dataVencimento,
          responsavelId: dados.responsavelId ?? null,
        },
      });
      geradas += 1;
    }

    await this.auditoria.registrar({
      escritorioId: usuario.escritorioId,
      atorId: usuario.id,
      acao: 'obrigacao_modelo.tarefas_geradas',
      entidade: 'ModeloObrigacao',
      entidadeId: modeloId,
      diff: { mes: dados.mes, ano: dados.ano, geradas, ignoradas },
    });

    return { geradas, ignoradas, total: empresas.length };
  }
}

function calcularVencimento(ano: number, mes: number, dia: number): Date {
  // Trata dias inválidos para o mês (ex.: 31 em fevereiro): usa o último dia.
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaSeguro = Math.min(dia, ultimoDia);
  return new Date(Date.UTC(ano, mes - 1, diaSeguro, 12, 0, 0));
}
