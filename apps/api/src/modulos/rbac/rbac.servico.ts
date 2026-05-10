import { Injectable } from '@nestjs/common';

const PAPEIS = ['PROPRIETARIO', 'ADMIN', 'CONTADOR', 'ASSISTENTE', 'CLIENTE'] as const;

const PERMISSOES = [
  'empresas:ler',
  'empresas:escrever',
  'documentos:ler',
  'documentos:escrever',
  'documentos:assinar',
  'tarefas:ler',
  'tarefas:escrever',
  'atendimento:responder',
  'automacoes:gerenciar',
  'relatorios:ver',
  'configuracoes:gerenciar',
] as const;

@Injectable()
export class RbacServico {
  listarPapeis(): readonly string[] {
    return PAPEIS;
  }

  listarPermissoes(): readonly string[] {
    return PERMISSOES;
  }
}
