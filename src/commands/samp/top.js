const samp = require("../../database/samp");

const TITLES = { level: "🆙・Top de nivel", money: "💵・Top de dinero", hours: "⏱️・Top de horas jugadas", kills: "🔫・Top de asesinatos" };

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const type = interaction.options.getString("type");
  const rows = await samp.getTop(type, 50);
  if (!rows.length) return client.errNormal({ error: "¡No se encontraron datos!", type: "editreply" }, interaction);

  const format = {
    level: (v) => `nivel ${v}`,
    money: (v) => client.samp.money(v),
    hours: (v) => `${client.samp.hours(v)} h`,
    kills: (v) => `${v}`,
  }[type] || ((v) => `${v}`);

  const lb = rows.map((r, i) => `**${i + 1}** | ${client.samp.name(r.name)} - \`${format(r.value)}\``);
  await client.createLeaderboard(TITLES[type] || TITLES.level, lb, interaction);
};
