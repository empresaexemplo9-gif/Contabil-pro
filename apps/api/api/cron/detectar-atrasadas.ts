import { detectarAtrasadas } from '../../src/jobs/detectar-atrasadas.job';
import { criarHandlerCron } from '../_lib/qstash';

export default criarHandlerCron(detectarAtrasadas);
