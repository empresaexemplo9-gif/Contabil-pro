import { Module } from '@nestjs/common';

import { ArmazenamentoServico } from './armazenamento.servico';
import { DocumentosControlador } from './documentos.controlador';
import { DocumentosServico } from './documentos.servico';

@Module({
  controllers: [DocumentosControlador],
  providers: [DocumentosServico, ArmazenamentoServico],
  exports: [DocumentosServico, ArmazenamentoServico],
})
export class DocumentosModule {}
