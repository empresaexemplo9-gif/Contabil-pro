export {
  enviarMensagemTexto as enviarMensagemWhatsapp,
  parsearWebhook as parsearWebhookWhatsapp,
  type CredenciaisWhatsapp,
  type EventoWebhook as EventoWebhookWhatsapp,
  type MensagemRecebida,
} from './whatsapp.js';

export {
  enviarEmail as enviarEmailResend,
  type CredenciaisResend,
  type EnviarEmailEntrada as EnviarEmailResendEntrada,
  type EmailEnviado as EmailEnviadoResend,
} from './resend.js';

export {
  criarDocumento as criarDocumentoZapsign,
  parsearWebhook as parsearWebhookZapsign,
  type CredenciaisZapsign,
  type CriarDocumentoEntrada as CriarDocumentoZapsignEntrada,
  type DocumentoCriado as DocumentoCriadoZapsign,
  type EventoWebhookZapsign,
  type SignatarioEntrada as SignatarioZapsignEntrada,
} from './zapsign.js';
