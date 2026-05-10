import { Module } from '@nestjs/common';

import { EmpresasControlador } from './empresas.controlador';
import { EmpresasServico } from './empresas.servico';

@Module({
  controllers: [EmpresasControlador],
  providers: [EmpresasServico],
  exports: [EmpresasServico],
})
export class EmpresasModule {}
