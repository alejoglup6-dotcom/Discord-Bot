const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const players = await samp.getOnlinePlayers();
  if (!players.length)
    return client.embed({ title: "🎮・Jugadores conectados", desc: "No hay nadie conectado ahora mismo", type: "editreply" }, interaction);

  const lb = players.map(
    (p) => `\`${String(p.playerid).padStart(3)}\` **${client.samp.name(p.name)}** · nivel ${p.level}${p.admin_level > 0 ? ` · ${samp.ADMIN_LEVELS[p.admin_level] || ""}` : ""}`,
  );
  await client.createLeaderboard(`🎮・Jugadores conectados (${players.length})`, lb, interaction);
};
