const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "ban");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;
  if (await samp.getActiveBan(target))
    return client.errNormal({ error: `${target.name} ya está baneado`, type: "editreply" }, interaction);

  const reason = client.samp.reason(interaction);
  await samp.ban(target, me, reason);

  client.succNormal(
    {
      text: `**${client.samp.name(target.name)}** baneado para siempre${Number(target.connected) ? " y expulsado del servidor" : ""}`,
      fields: [
        { name: "📄┆Razón", value: reason, inline: true },
        { name: "🛡️┆Por", value: `${client.samp.name(me.name)} (${interaction.user})`, inline: true },
      ],
      type: "editreply",
    },
    interaction,
  );
};
