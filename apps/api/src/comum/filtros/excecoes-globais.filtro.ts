import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';

import { ErroAplicacao } from '@contabilpro/utils';

@Catch()
export class FiltroExcecoesGlobais implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcecoesGlobais.name);

  catch(excecao: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const resposta = ctx.getResponse<Response>();

    if (excecao instanceof ZodError) {
      resposta.status(HttpStatus.BAD_REQUEST).json({
        codigo: 'VALIDACAO_FALHOU',
        mensagem: 'Dados de entrada inválidos',
        detalhes: excecao.flatten().fieldErrors,
      });
      return;
    }

    if (excecao instanceof ErroAplicacao) {
      resposta.status(excecao.statusHttp).json({
        codigo: excecao.codigo,
        mensagem: excecao.mensagem,
        detalhes: excecao.detalhes,
      });
      return;
    }

    if (excecao instanceof HttpException) {
      const status = excecao.getStatus();
      const corpo = excecao.getResponse();
      resposta.status(status).json(typeof corpo === 'string' ? { mensagem: corpo } : corpo);
      return;
    }

    this.logger.error('Erro não tratado', excecao);
    resposta.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro interno do servidor',
    });
  }
}
