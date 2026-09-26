const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const needs = (job) =>
    Object.keys(job.needs || {})
      .map((cat) => `${catalog.CATEGORIES[cat].emoji} ${catalog.CATEGORIES[cat].name.toLowerCase().replace(/s$/, "")}`)
      .join(", ");

  const lines = catalog.JOBS.map(
    (j) =>
      `${j.emoji} **${j.name}** · ${catalog.money(j.pay[0])} - ${catalog.money(j.pay[1])} · cada ${j.cooldown} min` +
      (j.needs ? ` · necesitas ${needs(j)}` : ""),
  );

  client.embed(
    {
      title: "👷・Oficios",
      desc: `${lines.join("\n")}\n\nFirma con \`/fortuna contrato\` o \`!contrato <oficio>\` y trabaja con \`!trabajar\`.`,
      type: "editreply",
    },
    interaction,
  );
};
