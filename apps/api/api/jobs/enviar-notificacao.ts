import { processarNotificacao } from '../../src/jobs/enviar-notificacao.job';
import { criarHandlerQStash } from '../_lib/qstash';

export default criarHandlerQStash(processarNotificacao);
