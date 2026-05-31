import { processarEmail } from '../../src/jobs/enviar-email.job';
import { criarHandlerQStash } from '../_lib/qstash';

export default criarHandlerQStash(processarEmail);
