/*
 * Botones 👍/👎 bajo cada respuesta de la IA (Fase 1 del plan).
 *
 *  - 👍: solo agradece (y cuenta en memoria para /ia estado).
 *  - 👎: manda al canal de revisión del staff la pregunta, la respuesta y las fuentes usadas, y la anota como
 *    hueco de conocimiento (/ia huecos). El staff la arregla con /ia corregir.
 *
 * Canal de revisión: IA_CANAL_REVISION (ID de canal). Si no está, se busca un canal de texto cuyo nombre contenga
 * "revision-ia"; si tampoco existe, el 👎 solo se anota como hueco.
 */
const Discord = require("discord.js");
const correcciones = require("./iaCorrecciones");

const IDS = { up: "Bot_ia_up", down: "Bot_ia_down" };
const ctx = new Map(); // id del mensaje de la IA -> { question, sources, userId }
const voted = new Map(); // id del mensaje de la IA -> Set(userId)
const counters = { up: 0, down: 0 };

function remember(messageId, data) {
  ctx.set(messageId, data);
  if (ctx.size > 500) ctx.delete(ctx.keys().next().value);
}

/** Fila de botones que se pega al último mensaje de la respuesta. */
function row() {
  return new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder().setCustomId(IDS.up).setEmoji("👍").setStyle(Discord.ButtonStyle.Secondary),
    new Discord.ButtonBuilder().setCustomId(IDS.down).setEmoji("👎").setStyle(Discord.ButtonStyle.Secondary),
  );
}

function reviewChannel(guild) {
  const id = process.env.IA_CANAL_REVISION;
  if (id) return guild.channels.cache.get(id) || null;
  return guild.channels.cache.find((c) => c.isTextBased?.() && !c.isThread?.() && /revision-ia/.test(c.name || "")) || null;
}

const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));

/**
 * Responde a Discord al instante (tiene 3 segundos) y recién después hace el trabajo pesado
 * (anotar el hueco, avisar al staff). Cualquier error se captura para que el botón nunca quede en "no respondió a tiempo".
 * @returns {Promise<boolean>} true si la interacción era de estos botones
 */
async function handle(client, interaction) {
  if (!interaction.isButton() || (interaction.customId !== IDS.up && interaction.customId !== IDS.down)) return false;
  const up = interaction.customId === IDS.up;
  const msg = interaction.message;

  // 1) Acuse inmediato (efímero). Si esto falla, la interacción ya expiró y no hay nada más que hacer.
  const acked = await interaction.deferReply({ flags: Discord.MessageFlags.Ephemeral }).then(() => true).catch(() => false);
  if (!acked) return true;
  const say = (content) => interaction.editReply({ content }).catch(() => {});

  try {
    const set = voted.get(msg.id) || new Set();
    if (set.has(interaction.user.id)) {
      await say("Ya votaste esta respuesta 🙂");
      return true;
    }
    set.add(interaction.user.id);
    voted.set(msg.id, set);
    if (voted.size > 1000) voted.delete(voted.keys().next().value);

    if (up) {
      counters.up++;
      await say("¡Gracias por avisar! 👍");
      return true;
    }

    counters.down++;
    await say("Gracias, se lo pasé al staff para que revise esta respuesta 👎. Si necesitas ayuda ya, abre un ticket.");

    // Pregunta: lo que se guardó al responder, o el mensaje al que respondió la IA (sobrevive a reinicios)
    const saved = ctx.get(msg.id);
    let question = saved?.question || "";
    if (!question && msg.reference?.messageId) {
      const ref = await msg.fetchReference().catch(() => null);
      question = ref?.cleanContent || ref?.content || "";
    }
    const answer = msg.content || "";
    const sources = saved?.sources?.length ? saved.sources.join(" · ") : "";

    await correcciones
      .recordGap(interaction.guild.id, { question: question || answer.slice(0, 100), answer, sources, kind: "mala-respuesta" })
      .catch((e) => console.log("IA hueco:", e.message));

    const channel = reviewChannel(interaction.guild);
    if (channel) {
      const embed = new Discord.EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("👎 Respuesta de la IA marcada como mala")
        .addFields(
          { name: "Pregunta", value: clip(question || "(no disponible)", 1000) },
          { name: "Respuesta de la IA", value: clip(answer || "(vacía)", 1000) },
          { name: "Fuentes usadas", value: clip(sources || "ninguna / no disponible", 500) },
          { name: "Marcada por", value: `<@${interaction.user.id}> en <#${msg.channelId}> · [ir al mensaje](${msg.url})` },
        )
        .setFooter({ text: "Corrígela con /ia corregir pregunta respuesta" });
      await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }).catch(() => {});
    }
  } catch (err) {
    console.log("IA feedback:", err.message);
    await say("😵 No pude registrar tu voto, intenta de nuevo.");
  }
  return true;
}

module.exports = { row, remember, handle, counters, IDS };
