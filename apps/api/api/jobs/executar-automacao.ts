import { executarAutomacao } from '../../src/jobs/executar-automacao.job';
import { criarHandlerQStash } from '../_lib/qstash';

export default criarHandlerQStash(executarAutomacao);
