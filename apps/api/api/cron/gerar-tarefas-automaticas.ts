import { gerarTarefasAutomaticas } from '../../src/jobs/gerar-tarefas-automaticas.job';
import { criarHandlerCron } from '../_lib/qstash';

export default criarHandlerCron(() => gerarTarefasAutomaticas());
