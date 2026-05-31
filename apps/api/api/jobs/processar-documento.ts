import { processarDocumento } from '../../src/jobs/processar-documento.job';
import { criarHandlerQStash } from '../_lib/qstash';

export default criarHandlerQStash(processarDocumento);
