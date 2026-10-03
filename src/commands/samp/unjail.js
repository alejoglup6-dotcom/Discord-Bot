const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "unjail");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;
  if (!(await samp.isJailed(target)))
    return client.errNormal({ error: `${target.name} no está en la cárcel`, type: "editreply" }, interaction);

  await samp.unjail(target, me);
  client.succNormal({ text: `**${client.samp.name(target.name)}** sale de la cárcel`, type: "editreply" }, interaction);
};
