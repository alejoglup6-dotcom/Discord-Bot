const samp = require("../../database/samp");

/**
 * Quita la última advertencia, como /quitaradv en el juego.
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "quitaradv");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;

  const left = await samp.unwarn(target);
  if (left < 0) return client.errNormal({ error: `${target.name} no tiene advertencias recientes`, type: "editreply" }, interaction);
  client.succNormal({ text: `Advertencia quitada a **${client.samp.name(target.name)}**: le quedan **${left}/3**`, type: "editreply" }, interaction);
};
