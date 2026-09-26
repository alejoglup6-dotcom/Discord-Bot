const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const linked = await samp.getLinkedPlayer(interaction.user.id);
  if (!linked || !(await samp.unlink(interaction.user.id)))
    return client.errNormal({ error: "No tienes ninguna cuenta del servidor vinculada", type: "editreply" }, interaction);

  client.succNormal({ text: `Tu Discord ya no está vinculado a **${client.samp.name(linked.name)}**`, type: "editreply" }, interaction);
};
