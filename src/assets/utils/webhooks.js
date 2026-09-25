const Discord = require("discord.js");

// Los webhooks de registros son opcionales. Si no están configurados (id o token
// vacíos) los envíos se ignoran en vez de lanzar errores sin manejar, y si Discord
// rechaza el envío se avisa en la consola sin tumbar nada.
const originalSend = Discord.WebhookClient.prototype.send;

Discord.WebhookClient.prototype.send = function (...args) {
  if (!this.id || !this.token) return Promise.resolve(null);

  return originalSend.apply(this, args).catch((error) => {
    console.log(`Webhook error: ${error.message}`);
    return null;
  });
};
