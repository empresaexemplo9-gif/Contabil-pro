import { processarWhatsapp } from '../../src/jobs/enviar-whatsapp.job';
import { criarHandlerQStash } from '../_lib/qstash';

export default criarHandlerQStash(processarWhatsapp);
