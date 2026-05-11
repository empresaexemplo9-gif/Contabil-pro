export {
  enviarMensagemTexto as enviarMensagemWhatsapp,
  parsearWebhook as parsearWebhookWhatsapp,
  type CredenciaisWhatsapp,
  type EventoWebhook as EventoWebhookWhatsapp,
  type MensagemRecebida,
} from './whatsapp.js';

export {
  criarDocumento as criarDocumentoZapsign,
  parsearWebhook as parsearWebhookZapsign,
  type CredenciaisZapsign,
  type CriarDocumentoEntrada as CriarDocumentoZapsignEntrada,
  type DocumentoCriado as DocumentoCriadoZapsign,
  type EventoWebhookZapsign,
  type SignatarioEntrada as SignatarioZapsignEntrada,
} from './zapsign.js';
