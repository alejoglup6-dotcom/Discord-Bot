const Discord = require("discord.js");

const invites = require("../../database/models/invites");
const { validInvitesByUser } = require("../../database/inviteRewards");
const inviteConfig = require("../../assets/data/invites");
const samp = require("../../database/samp");
const { textChannel } = require("../../assets/utils/guildLookup");

/*
 * Tablas que se actualizan solas (un mensaje del bot que se edita cada 5 minutos, solo si cambió):
 * - 🔔┆invitados: quién invitó a más gente al Discord (las invitaciones que siguen en el servidor).
 * - 💼┆millonarios: los que más dinero tienen en el juego (efectivo + banco, de la base de datos del servidor).
 * Los canales se buscan por su nombre ("invitados", "millonarios"); si no existen, no se hace nada.
 */
const INTERVAL = 5 * 60000;
const MEDALS = ["🥇", "🥈", "🥉"];
const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-ES");
const place = (i) => MEDALS[i] || `\`${String(i + 1).padStart(2)}.\``;

async function invitesBoard(client, guild) {
  const valid = await validInvitesByUser(guild.id);
  const rows = (await invites.find({ Guild: guild.id }).lean())
    .map((r) => ({ ...r, Valid: valid.get(r.User) || 0 }))
    .filter((r) => r.Valid > 0 || (r.Invites || 0) > 0);
  rows.sort((a, b) => b.Valid - a.Valid || (b.Invites || 0) - (a.Invites || 0));
  const lines = rows
    .slice(0, 20)
    .map((r, i) => {
      const others = (r.Invites || 0) - r.Valid;
      return `${place(i)} <@${r.User}> · **${r.Valid}** válidas` + (others > 0 ? ` *(+${others} sin premio)*` : "");
    });
  const info = textChannel(guild, /recompensas invitaciones/);
  return client
    .templateEmbed()
    .setTitle(`🔔・Ranking de invitaciones de ${guild.name}`)
    .setColor("#ff7a59")
    .setDescription(
      (lines.length ? lines.join("\n") : "Todavía nadie invitó a nadie. ¡Sé el primero!") +
        `\n\n✅ **Válidas**: cuentas de Discord con más de ${inviteConfig.MIN_ACCOUNT_DAYS} días que siguen en el servidor. Son las que dan premios${info ? ` (mira ${info})` : ""}.` +
        `\n🛡️ *Sin premio*: cuentas nuevas o de prueba; no cuentan para evitar multicuentas.`,
    )
    .setFooter({ text: "Se actualiza cada 5 minutos" });
}

async function richestBoard(client, guild) {
  const rows = await samp.getRichest(15);
  const lines = rows.map(
    (r, i) => `${place(i)} ${Number(r.connected) ? "🟢" : "⚫"} **${Discord.escapeMarkdown(r.name)}** · ${money(r.total)} *(nivel ${r.level})*`,
  );
  return client
    .templateEmbed()
    .setTitle(`💼・Millonarios de ${guild.name}`)
    .setColor("#2ecc71")
    .setDescription(
      (lines.length ? lines.join("\n") : "Todavía no hay jugadores.") +
        "\n\nDinero dentro del juego (efectivo + banco). 🟢 conectado ahora · ⚫ desconectado.",
    )
    .setFooter({ text: "Se actualiza cada 5 minutos con los datos del servidor de juego" });
}

module.exports = (client) => {
  const messages = new Map(); // canal -> mensaje de la tabla
  const last = new Map(); // canal -> contenido publicado (para no editar si no cambió)

  async function publish(channel, embed) {
    const body = embed.toJSON();
    const key = JSON.stringify({ ...body, timestamp: undefined });
    if (last.get(channel.id) === key) return;
    let msg = messages.get(channel.id);
    if (!msg) {
      const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
      msg = recent?.find((m) => m.author.id === client.user.id && m.embeds[0]?.title === body.title) || null;
    }
    msg = msg ? await msg.edit({ embeds: [embed] }).catch(() => null) : null;
    if (!msg) msg = await channel.send({ embeds: [embed] }).catch(() => null);
    if (msg) {
      messages.set(channel.id, msg);
      last.set(channel.id, key);
    }
  }

  async function update() {
    const sampReady = await samp.isAvailable().catch(() => false);
    for (const guild of client.guilds.cache.values()) {
      const inv = textChannel(guild, /^invitados$/);
      if (inv) await publish(inv, await invitesBoard(client, guild)).catch((e) => console.log(e));
      const rich = sampReady && textChannel(guild, /^millonarios$/);
      if (rich) await publish(rich, await richestBoard(client, guild)).catch((e) => console.log(e));
    }
  }

  client.once(Discord.Events.ClientReady, () => {
    setTimeout(update, 20000);
    setInterval(update, INTERVAL);
  });
};
module.exports.invitesBoard = invitesBoard;
module.exports.richestBoard = richestBoard;
