const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "tempban");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;
  if (await samp.getActiveBan(target))
    return client.errNormal({ error: `${target.name} ya está baneado`, type: "editreply" }, interaction);

  const days = interaction.options.getInteger("days");
  const reason = client.samp.reason(interaction);
  await samp.ban(target, me, reason, days);

  client.succNormal(
    {
      text: `**${client.samp.name(target.name)}** baneado ${days} día(s)${Number(target.connected) ? " y expulsado del servidor" : ""}`,
      fields: [
        { name: "📄┆Razón", value: reason, inline: true },
        { name: "⏰┆Hasta", value: `<t:${Math.floor(Date.now() / 1000) + days * 86400}:f>`, inline: true },
        { name: "🛡️┆Por", value: `${client.samp.name(me.name)} (${interaction.user})`, inline: true },
      ],
      type: "editreply",
    },
    interaction,
  );
};
