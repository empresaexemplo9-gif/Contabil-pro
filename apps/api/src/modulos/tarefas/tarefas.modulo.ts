import { Module } from '@nestjs/common';
import { TarefasControlador } from './tarefas.controlador';
import { TarefasServico } from './tarefas.servico';

@Module({
  controllers: [TarefasControlador],
  providers: [TarefasServico],
  exports: [TarefasServico],
})
export class TarefasModule {}
