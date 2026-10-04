const samp = require("../../database/samp");

/**
 * Da la membresía de Socio (anual, player.vip = 3). Por ahora no se vende: solo la da el staff desde aquí.
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "socio");
  if (!me) return;
  const target = await client.samp.target(interaction);
  if (!target) return;

  const days = interaction.options.getInteger("days");
  await samp.grantSocio(target, days, me);

  client.succNormal(
    {
      text: `**${client.samp.name(target.name)}** recibe **Socio** por ${days} día(s)`,
      fields: [{ name: "ℹ️┆Entrega", value: "El servidor lo aplica en unos segundos (o al entrar). Si tenía VIP, los días se suman.", inline: false }],
      type: "editreply",
    },
    interaction,
  );
};
