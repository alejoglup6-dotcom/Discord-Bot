/*
 * Compras de CityCoins por Tebex: el bot de Tebex escribe en un canal algo como
 *
 *   @usuario ha comprado 10 citycoins
 *   !juego coins @usuario 10
 *
 * Los demás bots no pasan por messageCreate (se ignoran), así que aquí se atiende ese mensaje a propósito:
 *  - Solo si lo escribe un bot de TEBEX_BOT_IDS (ids separados por comas). Sin esa variable no se hace nada.
 *  - Opcional: TEBEX_CHANNEL_IDS limita los canales donde se leen (ids separados por comas).
 *  - Solo se acepta "!juego coins @usuario cantidad" (nada más del /juego), con cantidad de 1 a TEBEX_MAX_COINS
 *    (por defecto 5000). Un bot nunca puede ejecutar otro comando del juego.
 *  - El @ tiene que ser de un usuario con la cuenta del juego vinculada (/samp link). Si no la tiene, se le avisa
 *    por MD (si los tiene cerrados, se avisa en el canal para que el staff lo vea).
 *  - Los coins se entregan igual que con /juego coins: fila en discord_actions que aplica el gamemode.
 */
const samp = require("../../database/samp");

const LINE_RE = /^[ \t]*!?juego[ \t]+(?:coins|citycoins)[ \t]+<@!?(\d{15,21})>[ \t]+(\d{1,7})[ \t]*$/gim;
const MAX_LINES = 5;
const WAIT_MS = 12000;

const seen = new Set();
const hinted = new Set();

function list(name) {
  return String(process.env[name] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function maxCoins() {
  const n = parseInt(process.env.TEBEX_MAX_COINS, 10);
  return n > 0 ? n : 5000;
}

// Órdenes "!juego coins" de un mensaje: [{ discordId, amount }]
function parse(content) {
  const out = [];
  for (const m of String(content || "").matchAll(LINE_RE)) {
    out.push({ discordId: m[1], amount: parseInt(m[2], 10) });
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

// Llamado desde messageCreate con los mensajes de bots. No lanza errores.
async function onBotMessage(client, message) {
  try {
    if (!message.guild || message.author.id === client.user.id) return;
    const orders = parse(message.content);
    if (!orders.length) return;

    const bots = list("TEBEX_BOT_IDS");
    if (!bots.includes(message.author.id)) {
      // Una sola vez por bot: dice qué id hay que poner en TEBEX_BOT_IDS
      if (!hinted.has(message.author.id)) {
        hinted.add(message.author.id);
        console.log(
          `Tebex: ignoro "!juego coins" de ${message.author.tag} (${message.author.id}). ` +
            `Si es el bot de Tebex, pon TEBEX_BOT_IDS=${message.author.id} en el .env y reinicia.`,
        );
      }
      return;
    }
    const channels = list("TEBEX_CHANNEL_IDS");
    if (channels.length && !channels.includes(message.channelId)) return;

    if (seen.has(message.id)) return;
    seen.add(message.id);
    if (seen.size > 500) seen.delete(seen.values().next().value);

    if (!(await samp.isAvailable())) {
      console.log("Tebex: la base de datos del bot no es la del servidor de SA-MP");
      return;
    }

    for (const order of orders) await deliver(client, message, order);
  } catch (err) {
    console.log("Tebex:", err.message);
  }
}

async function deliver(client, message, { discordId, amount }) {
  const reply = (content) =>
    message.reply({ content, allowedMentions: { parse: [] } }).catch(() => null);

  if (amount < 1 || amount > maxCoins()) {
    await message.react("❌").catch(() => {});
    await reply(`❌ Cantidad no válida (${amount}): el máximo por compra es ${maxCoins()} CityCoins.`);
    return;
  }

  const player = await samp.getLinkedPlayer(discordId);
  if (!player) {
    const sent = await client.samp.warnUnlinked(
      discordId,
      `Has comprado **${amount} CityCoins**, pero tu cuenta del servidor **no está vinculada** a Discord, así que no se pudieron entregar todavía.`,
    );
    await message.react("⚠️").catch(() => {});
    console.log(`Tebex: ${amount} CityCoins para ${discordId}, que no tiene la cuenta vinculada (MD ${sent ? "enviado" : "cerrado"})`);
    if (!sent) {
      await reply(`⚠️ <@${discordId}> no tiene la cuenta vinculada y no puedo escribirle por MD. Hay que darle ${amount} CityCoins a mano cuando se vincule.`);
    }
    return;
  }

  const id = await samp.queueGameAction(player.id, "addcoins", amount, `Compra Tebex: ${amount} CityCoins`, "Tebex");
  const done = await samp.waitAction(id, WAIT_MS);
  await message.react(done ? "✅" : "⏳").catch(() => {});
  await reply(
    done
      ? `✅ ${amount} CityCoins entregados a **${client.samp.name(player.name)}**.`
      : `⏳ ${amount} CityCoins en cola para **${client.samp.name(player.name)}**: el servidor no respondió todavía (¿apagado?). Se aplicarán en cuanto lo procese.`,
  );
}

module.exports = { onBotMessage, parse };
