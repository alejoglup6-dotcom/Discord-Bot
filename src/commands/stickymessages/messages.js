const Discord = require("discord.js");

const Schema = require("../../database/models/stickymessages");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const data = await Schema.find({ Guild: interaction.guild.id });

  if (data) {
    let list = ``;

    for (var i = 0; i < data.length; i++) {
      list += `**${i + 1}** - Canal: ${data[i].Channel}`;
    }

    await client.embed(
      {
        title: `💬・Mensajes fijos`,
        desc: list,
        type: "editreply",
      },
      interaction,
    );
  } else {
    client.errNormal(
      {
        error: "¡No se encontraron datos!",
        type: "editreply",
      },
      interaction,
    );
  }
};
