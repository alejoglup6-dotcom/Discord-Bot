const Discord = require("discord.js");
const tickets = require("../../assets/utils/ticketsPro");
const { BY_KEY } = require("../../assets/data/tickets");
const { brandEmbed } = require("../../assets/utils/brand");

/**
 * /tickets stats: resumen de los tickets del sistema nuevo (solo staff).
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction) => {
  const config = await require("../../database/models/tickets").findOne({ Guild: interaction.guild.id });
  if (!tickets.isStaff(interaction.member, config))
    return client.errNormal({ error: "Solo el staff puede ver las estadísticas de tickets", type: "editreply" }, interaction);
  const days = interaction.options.getInteger("days") || 30;
  const s = await tickets.stats(interaction.guild.id, days);
  const types = Object.entries(s.byType)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${BY_KEY.get(k)?.emoji || "🎫"} ${BY_KEY.get(k)?.label || k}: **${n}**`)
    .join("\n");
  const staff = Object.entries(s.byStaff)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, n], i) => `${i + 1}. <@${id}> · **${n}**`)
    .join("\n");
  const embed = brandEmbed(interaction.guild, {
    title: `TICKETS · ÚLTIMOS ${days} DÍAS`,
    fields: [
      { name: "Abiertos en el periodo", value: String(s.total), inline: true },
      { name: "Siguen abiertos", value: String(s.open), inline: true },
      { name: "Valoración media", value: s.rated ? `${s.avg.toFixed(1)} ★ (${s.rated})` : "Sin valoraciones", inline: true },
      { name: "Primera respuesta (media)", value: s.firstResponseMin ? `${Math.round(s.firstResponseMin)} min` : "—", inline: true },
      { name: "Por tipo", value: types || "—" },
      { name: "Quién atiende más", value: staff || "—" },
    ],
  });
  return interaction.editReply({ embeds: [embed] }).catch(() => {});
};
