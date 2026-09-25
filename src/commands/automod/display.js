const Discord = require("discord.js");

const Schema = require("../../database/models/blacklist");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (data && data.Words.length > 0) {
      client.embed(
        {
          title: "🤬・Palabras en la lista negra",
          desc: data.Words.join(", "),
          type: "editreply",
        },
        interaction,
      );
    } else {
      client.errNormal(
        {
          error: `¡Este servidor no tiene datos!`,
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
