const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const r = await fortuna.work(interaction.guild.id, interaction.user.id);

  if (r.error === "no_contract")
    return client.errNormal({ error: "No tienes oficio. Mira /fortuna trabajos y firma uno con /fortuna contrato", type: "editreply" }, interaction);
  if (r.error === "cooldown")
    return client.errNormal({ error: `Debes esperar ${formatWait(r.wait)} para tu próximo turno`, type: "editreply" }, interaction);

  client.embed(
    {
      title: `👷・Trabajando`,
      desc: `${r.job.emoji} ${interaction.user} ${r.job.text} y recibes **${catalog.money(r.pay)}**`,
      fields: [{ name: "💵┆Efectivo", value: catalog.money(r.money), inline: true }],
      type: "editreply",
    },
    interaction,
  );
};

function formatWait(s) {
  if (s < 60) return `${s} segundos`;
  const m = Math.floor(s / 60);
  return `${m} min ${s % 60} s`;
}
module.exports.formatWait = formatWait;
