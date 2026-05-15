import { apenasDigitos } from '@contabilpro/utils';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../comum/prisma/prisma.service';
import { AuditoriaServico } from '../auditoria/auditoria.servico';
import { DispatcherAutomacoes } from '../automacoes/dispatcher.servico';

import type {
  BuscarEmpresas,
  CriarContatoEmpresaEntrada,
  CriarEmpresaEntrada,
} from '@contabilpro/contracts';
import type { Prisma } from '@contabilpro/database';


@Injectable()
export class EmpresasServico {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaServico,
    private readonly dispatcher: DispatcherAutomacoes,
  ) {}

  async listar(escritorioId: string, filtros: BuscarEmpresas) {
    const condicoes: Prisma.EmpresaWhereInput = { escritorioId };

    if (filtros.regime) condicoes.regime = filtros.regime;
    if (filtros.status) condicoes.status = filtros.status;
    if (filtros.termo) {
      const termo = filtros.termo;
      const apenasDigs = apenasDigitos(termo);
      condicoes.OR = [
        { razaoSocial: { contains: termo, mode: 'insensitive' } },
        { nomeFantasia: { contains: termo, mode: 'insensitive' } },
        ...(apenasDigs.length > 0 ? [{ cnpj: { contains: apenasDigs } }] : []),
      ];
    }

    const [itens, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where: condicoes,
        orderBy: { [filtros.ordenarPor]: filtros.ordem },
        skip: (filtros.pagina - 1) * filtros.tamanho,
        take: filtros.tamanho,
      }),
      this.prisma.empresa.count({ where: condicoes }),
    ]);

    return { itens, total, pagina: filtros.pagina, tamanho: filtros.tamanho };
  }

  async obter(escritorioId: string, id: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id, escritorioId },
      include: { contatos: { orderBy: [{ principal: 'desc' }, { nome: 'asc' }] } },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  async criar(
    escritorioId: string,
    atorId: string | undefined,
    dados: CriarEmpresaEntrada,
  ) {
    const cnpj = apenasDigitos(dados.cnpj);

    const existente = await this.prisma.empresa.findUnique({
      where: { escritorioId_cnpj: { escritorioId, cnpj } },
    });
    if (existente) throw new ConflictException('Já existe uma empresa com este CNPJ');

    const empresa = await this.prisma.empresa.create({
      data: {
        escritorioId,
        cnpj,
        razaoSocial: dados.razaoSocial,
        nomeFantasia: dados.nomeFantasia ?? null,
        inscricaoEstadual: dados.inscricaoEstadual ?? null,
        inscricaoMunicipal: dados.inscricaoMunicipal ?? null,
        regime: dados.regime,
        dataAbertura: dados.dataAbertura ?? null,
        endereco: (dados.endereco as Prisma.InputJsonValue) ?? undefined,
        observacoes: dados.observacoes ?? null,
      },
    });

    await this.auditoria.registrar({
      escritorioId,
      atorId,
      acao: 'empresa.criada',
      entidade: 'Empresa',
      entidadeId: empresa.id,
      diff: { depois: dados },
    });

    await this.dispatcher.disparar({
      tipo: 'EMPRESA_CADASTRADA',
      escritorioId,
      payload: {
        empresa: {
          id: empresa.id,
          cnpj: empresa.cnpj,
          razaoSocial: empresa.razaoSocial,
          nomeFantasia: empresa.nomeFantasia,
          regime: empresa.regime,
          status: empresa.status,
        },
      },
    });

    return empresa;
  }

  async atualizar(
    escritorioId: string,
    atorId: string | undefined,
    id: string,
    dados: Partial<CriarEmpresaEntrada>,
  ) {
    const anterior = await this.obter(escritorioId, id);
    const cnpj = dados.cnpj ? apenasDigitos(dados.cnpj) : undefined;

    if (cnpj && cnpj !== anterior.cnpj) {
      const existente = await this.prisma.empresa.findUnique({
        where: { escritorioId_cnpj: { escritorioId, cnpj } },
      });
      if (existente) throw new ConflictException('Já existe outra empresa com este CNPJ');
    }

    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: {
        ...dados,
        cnpj,
        endereco: dados.endereco ? (dados.endereco as Prisma.InputJsonValue) : undefined,
      },
    });

    await this.auditoria.registrar({
      escritorioId,
      atorId,
      acao: 'empresa.atualizada',
      entidade: 'Empresa',
      entidadeId: id,
      diff: { antes: anterior, depois: empresa },
    });

    return empresa;
  }

  async remover(escritorioId: string, atorId: string | undefined, id: string) {
    await this.obter(escritorioId, id);
    await this.prisma.empresa.update({
      where: { id },
      data: { status: 'INATIVA' },
    });
    await this.auditoria.registrar({
      escritorioId,
      atorId,
      acao: 'empresa.inativada',
      entidade: 'Empresa',
      entidadeId: id,
    });
    return { ok: true };
  }

  async listarContatos(escritorioId: string, empresaId: string) {
    await this.obter(escritorioId, empresaId);
    return this.prisma.contatoEmpresa.findMany({
      where: { empresaId },
      orderBy: [{ principal: 'desc' }, { nome: 'asc' }],
    });
  }

  async criarContato(
    escritorioId: string,
    atorId: string | undefined,
    empresaId: string,
    dados: CriarContatoEmpresaEntrada,
  ) {
    await this.obter(escritorioId, empresaId);
    if (dados.principal) {
      await this.prisma.contatoEmpresa.updateMany({
        where: { empresaId, principal: true },
        data: { principal: false },
      });
    }
    const contato = await this.prisma.contatoEmpresa.create({
      data: {
        empresaId,
        nome: dados.nome,
        email: dados.email ?? null,
        telefone: dados.telefone ?? null,
        cargo: dados.cargo ?? null,
        principal: dados.principal,
      },
    });
    await this.auditoria.registrar({
      escritorioId,
      atorId,
      acao: 'contato.criado',
      entidade: 'ContatoEmpresa',
      entidadeId: contato.id,
    });
    return contato;
  }

  async removerContato(
    escritorioId: string,
    atorId: string | undefined,
    empresaId: string,
    contatoId: string,
  ) {
    await this.obter(escritorioId, empresaId);
    const contato = await this.prisma.contatoEmpresa.findFirst({
      where: { id: contatoId, empresaId },
    });
    if (!contato) throw new NotFoundException('Contato não encontrado');
    await this.prisma.contatoEmpresa.delete({ where: { id: contatoId } });
    await this.auditoria.registrar({
      escritorioId,
      atorId,
      acao: 'contato.removido',
      entidade: 'ContatoEmpresa',
      entidadeId: contatoId,
    });
    return { ok: true };
  }
}
