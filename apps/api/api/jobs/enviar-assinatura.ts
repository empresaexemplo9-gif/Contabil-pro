import { enviarAssinatura } from '../../src/jobs/enviar-assinatura.job';
import { criarHandlerQStash } from '../_lib/qstash';

export default criarHandlerQStash(enviarAssinatura);
