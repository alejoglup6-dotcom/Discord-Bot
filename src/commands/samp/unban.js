const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "unban");
  if (!me) return;
  const target = await client.samp.target(interaction);
  if (!target) return;

  if (!(await samp.unban(target, me)))
    return client.errNormal({ error: `${target.name} no está en la lista de baneados`, type: "editreply" }, interaction);

  client.succNormal({ text: `**${client.samp.name(target.name)}** ha sido desbaneado`, type: "editreply" }, interaction);
};
