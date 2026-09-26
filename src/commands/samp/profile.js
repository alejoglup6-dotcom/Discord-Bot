const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const name = interaction.options.getString("name");
  const user = interaction.options.getUser("user") || (name ? null : interaction.user);

  let player;
  if (name) {
    player = await samp.getPlayerByName(name);
    if (!player) return client.errNormal({ error: `No existe ninguna cuenta llamada ${name}`, type: "editreply" }, interaction);
  } else {
    player = await samp.getLinkedPlayer(user.id);
    if (!player)
      return client.errNormal(
        {
          error:
            user.id === interaction.user.id
              ? "No tienes una cuenta vinculada. Usa /samp link o indica un nombre"
              : `${user.username} no tiene una cuenta del servidor vinculada`,
          type: "editreply",
        },
        interaction,
      );
  }

  const discordId = await samp.getLinkedDiscord(player.id);
  // El dinero y el teléfono solo los ve el dueño de la cuenta o el staff del servidor
  const viewer = discordId === interaction.user.id ? player : await samp.getLinkedPlayer(interaction.user.id);
  const isPrivate = discordId === interaction.user.id || (viewer && viewer.admin_level > 0);

  const fields = [
    { name: "🆙┆Nivel", value: `${player.level} (${player.rep} rep)`, inline: true },
    { name: "⏱️┆Horas jugadas", value: client.samp.hours(player.time_playing), inline: true },
    {
      name: "📶┆Estado",
      value: Number(player.connected) ? `🟢 Conectado (ID ${player.playerid})` : `🔴 Desconectado\nÚltima vez: ${player.last_connection}`,
      inline: true,
    },
    { name: "📅┆Registro", value: String(player.reg_date), inline: true },
    { name: "👥┆Banda", value: player.crew_name || "Ninguna", inline: true },
    {
      name: "⭐┆VIP",
      value: Number(player.vip) ? `VIP ${player.vip}${player.vip_expire_date ? `\nHasta ${player.vip_expire_date}` : ""}` : "No",
      inline: true,
    },
    { name: "🔫┆Asesinatos", value: String(player.kills_count), inline: true },
    { name: "🚓┆Arrestos", value: String(player.arrests_count), inline: true },
  ];
  if (player.admin_level > 0)
    fields.push({ name: "🛡️┆Rango", value: samp.ADMIN_LEVELS[player.admin_level] || String(player.admin_level), inline: true });
  if (isPrivate) {
    fields.push(
      { name: "💵┆Efectivo", value: client.samp.money(player.cash), inline: true },
      { name: "🏦┆Banco", value: Number(player.bank_account) ? client.samp.money(player.bank_money) : "Sin cuenta", inline: true },
      { name: "🪙┆Coins", value: String(player.coins), inline: true },
    );
    if (Number(player.phone_number)) fields.push({ name: "📱┆Teléfono", value: String(player.phone_number), inline: true });
  }
  if (discordId) fields.push({ name: "🔗┆Discord", value: `<@${discordId}>`, inline: true });

  const ban = await samp.getActiveBan(player);
  if (ban)
    fields.push({
      name: "🚫┆Baneado",
      value: `${ban.expires ? `Hasta <t:${ban.expires}:f>` : "Permanente"}${ban.text ? `\nRazón: ${ban.text}` : ""}`,
    });

  client.embed({ title: `🎮・${client.samp.name(player.name)}`, fields, type: "editreply" }, interaction);
};
