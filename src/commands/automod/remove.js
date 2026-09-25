const Discord = require("discord.js");

const Schema = require("../../database/models/blacklist");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const word = interaction.options.getString("word");

  Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (data) {
      if (!data.Words.includes(word)) {
        return client.errNormal(
          {
            error: `¡Esa palabra no existe en la base de datos!`,
            type: "editreply",
          },
          interaction,
        );
      }

      const filtered = data.Words.filter((target) => target !== word);

      await Schema.findOneAndUpdate(
        { Guild: interaction.guild.id },
        {
          Guild: interaction.guild.id,
          Words: filtered,
        },
      );

      client.succNormal(
        {
          text: `La palabra se eliminó de la lista negra`,
          fields: [
            {
              name: `💬┆Palabra`,
              value: `${word}`,
            },
          ],
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
