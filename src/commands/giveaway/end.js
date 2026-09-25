const Discord = require("discord.js");
const ms = require("ms");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const messageID = interaction.options.getString("message");
  const giveaway = client.giveawaysManager.giveaways.find(
    (g) => g.guildId === interaction.guildId && g.messageId === messageID,
  );
  if (!giveaway)
    return client.errNormal(
      { error: "Este ID de mensaje no es de este servidor", type: "editreply" },
      interaction,
    );
  client.giveawaysManager
    .edit(messageID, {
      setEndTimestamp: Date.now(),
    })
    .then(() => {
      client.succNormal(
        {
          text: `El sorteo terminará en menos de ${client.giveawaysManager.options.updateCountdownEvery / 1000} segundos`,
          type: "editreply",
        },
        interaction,
      );
    })
    .catch((err) => {
      client.errNormal(
        {
          error: `¡No encuentro el sorteo con ID ${messageID}!`,
          type: "editreply",
        },
        interaction,
      );
    });
};
