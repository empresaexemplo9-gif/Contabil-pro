import { Module } from '@nestjs/common';
import { RbacControlador } from './rbac.controlador';
import { RbacServico } from './rbac.servico';

@Module({
  controllers: [RbacControlador],
  providers: [RbacServico],
  exports: [RbacServico],
})
export class RbacModule {}
