const fortuna = require("../../database/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const r = await fortuna.resign(interaction.guild.id, interaction.user.id);
  if (r.error) return client.errNormal({ error: "No tienes ningún contrato", type: "editreply" }, interaction);
  client.succNormal({ text: `Renunciaste a tu trabajo de **${r.job?.name || "?"}**`, type: "editreply" }, interaction);
};
