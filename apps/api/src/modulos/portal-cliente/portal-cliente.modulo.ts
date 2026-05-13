import { Module } from '@nestjs/common';

import { DocumentosModule } from '../documentos/documentos.modulo';

import { PortalClienteControlador } from './portal-cliente.controlador';
import { PortalClienteServico } from './portal-cliente.servico';

@Module({
  imports: [DocumentosModule],
  controllers: [PortalClienteControlador],
  providers: [PortalClienteServico],
})
export class PortalClienteModule {}
