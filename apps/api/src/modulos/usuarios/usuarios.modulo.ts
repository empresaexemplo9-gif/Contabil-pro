import { Module } from '@nestjs/common';
import { UsuariosControlador } from './usuarios.controlador';
import { UsuariosServico } from './usuarios.servico';

@Module({
  controllers: [UsuariosControlador],
  providers: [UsuariosServico],
  exports: [UsuariosServico],
})
export class UsuariosModule {}
