const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const top = await fortuna.leaderboard(interaction.guild.id, 50);
  if (!top.length) return client.errNormal({ error: "Todavía nadie tiene fortuna. ¡Empieza con /fortuna trabajos!", type: "editreply" }, interaction);

  const medals = ["🥇", "🥈", "🥉"];
  const lb = top.map(
    (u, i) =>
      `${medals[i] || `**${i + 1}.**`} <@${u.user}> · **${catalog.money(u.total)}**` +
      (u.count ? ` · ${u.count} propiedades` : ""),
  );
  const prizes = catalog.WEEKLY_PRIZES.map((p, i) => `${medals[i]} ${catalog.money(p)}`).join("  ");
  lb.push("", `🏆 Premios de cada domingo: ${prizes}`);

  await client.createLeaderboard(`🕴️・Mayores fortunas de ${interaction.guild.name}`, lb, interaction);
};
