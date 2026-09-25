const Discord = require("discord.js");

const Schema = require("../../database/models/birthday");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  Schema.findOne({
    Guild: interaction.guild.id,
    User: interaction.user.id,
  }).then(async (data) => {
    if (!data)
      return client.errNormal(
        {
          error: "¡No se encontró ningún cumpleaños!",
          type: "editreply",
        },
        interaction,
      );

    client.embed(
      {
        title: `${client.emotes.normal.birthday}・Consulta de cumpleaños`,
        desc: `El cumpleaños de ${interaction.user.username} es el ${data.Birthday}`,
        type: "editreply",
      },
      interaction,
    );
  });
};
