const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "mute");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;
  if (await samp.isMuted(target))
    return client.errNormal({ error: `${target.name} ya está silenciado`, type: "editreply" }, interaction);

  const minutes = interaction.options.getInteger("minutes");
  const reason = client.samp.reason(interaction);
  const until = await samp.setMute(target, me, minutes, reason);

  client.succNormal(
    {
      text: `**${client.samp.name(target.name)}** silenciado del canal de dudas ${minutes} minuto(s)`,
      fields: [
        { name: "📄┆Razón", value: reason, inline: true },
        { name: "⏰┆Hasta", value: `<t:${until}:t>`, inline: true },
      ],
      type: "editreply",
    },
    interaction,
  );
};
