const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "unmute");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;
  if (!(await samp.isMuted(target)))
    return client.errNormal({ error: `${target.name} no está silenciado`, type: "editreply" }, interaction);

  await samp.setMute(target, me, 0, "");
  client.succNormal({ text: `**${client.samp.name(target.name)}** ya puede volver a enviar dudas`, type: "editreply" }, interaction);
};
