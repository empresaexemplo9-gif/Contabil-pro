import { Global, Module } from '@nestjs/common';

import { AuditoriaControlador } from './auditoria.controlador';
import { AuditoriaServico } from './auditoria.servico';

@Global()
@Module({
  controllers: [AuditoriaControlador],
  providers: [AuditoriaServico],
  exports: [AuditoriaServico],
})
export class AuditoriaModule {}
