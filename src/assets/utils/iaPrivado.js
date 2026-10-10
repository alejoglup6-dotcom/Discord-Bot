/*
 * Respuestas privadas de la IA.
 *
 * Cuando la respuesta lleva datos de la cuenta de quien pregunta (nivel, dinero, banco, horas, crew, VIP, coins), no se
 * publica en el canal: se manda por mensaje privado y en el canal solo se avisa. Si la persona tiene los MD cerrados NO
 * se publica en el canal (se le dice cómo verlo por otro lado). Los datos que no son personales (conectados, staff,
 * normas, comandos...) se siguen contestando en el canal como siempre.
 *
 *   IA_PRIVADO=0   desactiva esto (las respuestas con datos de cuenta vuelven a salir en el canal)
 */

// Marca que pone iaEnVivo.js delante de los datos de la cuenta (ver ownAccount / getLive)
const MARK = "CUENTA VINCULADA DE QUIEN PREGUNTA";

const enabled = () => !/^(0|off|no|false)$/i.test(String(process.env.IA_PRIVADO ?? "1").trim());

/** ¿El conocimiento que recibió la IA incluye datos de la cuenta de quien pregunta? */
const isPersonal = (knowledgeText) => enabled() && String(knowledgeText || "").includes(MARK);

const NOTICE_OK = "📩 Tus datos de cuenta te los mandé por mensaje privado para que no los vea nadie más.";
const NOTICE_FAIL =
  "🔒 No puedo mandarte tus datos por privado porque tienes los mensajes directos cerrados, y no los publico aquí. " +
  "Ábrelos (Ajustes del servidor → Privacidad → Mensajes directos) y vuelve a preguntarme, o míralos en el juego con `/est`.";

/**
 * Envía la respuesta por MD y avisa en el canal.
 * @param {object} message mensaje del usuario
 * @param {string} text respuesta de la IA
 * @param {(t: string) => string[]} split función que parte el texto en mensajes de Discord
 * @returns {Promise<{ id: string, content: string }[]>} los mensajes que sí llegaron por MD
 */
async function deliver(message, text, split) {
  const sent = [];
  let failed = false;
  for (const part of split(text)) {
    const m = await message.author.send({ content: part, allowedMentions: { parse: [] } }).catch(() => null);
    if (!m) {
      failed = true;
      break;
    }
    sent.push({ id: m.id, content: part });
  }
  const notice = failed && !sent.length ? NOTICE_FAIL : NOTICE_OK;
  await message.reply({ content: notice, allowedMentions: { parse: [], repliedUser: false } }).catch(() => message.channel.send({ content: notice, allowedMentions: { parse: [] } }).catch(() => {}));
  return sent;
}

module.exports = { enabled, isPersonal, deliver, MARK, NOTICE_OK, NOTICE_FAIL };
