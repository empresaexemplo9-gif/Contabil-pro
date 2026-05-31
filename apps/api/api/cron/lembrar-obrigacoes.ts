import { lembrarObrigacoes } from '../../src/jobs/lembrar-obrigacao.job';
import { criarHandlerCron } from '../_lib/qstash';

export default criarHandlerCron(lembrarObrigacoes);
