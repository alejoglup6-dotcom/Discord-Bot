const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "jail");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;

  const minutes = interaction.options.getInteger("minutes");
  const reason = client.samp.reason(interaction);
  await samp.jail(target, me, minutes, reason);

  client.succNormal(
    {
      text: `**${client.samp.name(target.name)}** irá a la cárcel ${minutes} minuto(s)`,
      fields: [
        { name: "📄┆Razón", value: reason, inline: true },
        { name: "🎮┆Cuándo", value: "Al momento si está conectado; si no, al entrar al servidor", inline: true },
      ],
      type: "editreply",
    },
    interaction,
  );
};
