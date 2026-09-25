const Discord = require("discord.js");
const ms = require("ms");

/**
 *
 * @param {Discord.Client} client
 * @param {Discord.Interaction} interaction
 * @param {*} args
 * @returns
 */
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
    .reroll(messageID)
    .then(() => {
      client.succNormal(
        {
          text: `Sorteo resorteado`,
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
