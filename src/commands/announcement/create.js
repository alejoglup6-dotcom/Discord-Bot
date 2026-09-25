const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const message = interaction.options.getString("message");
  const channel = interaction.options.getChannel("channel");

  client.embed(
    {
      title: `📢・¡Anuncio!`,
      desc: message,
    },
    channel,
  );

  client.succNormal(
    {
      text: `¡El anuncio se envió correctamente!`,
      fields: [
        {
          name: `📘┆Canal`,
          value: `${channel} (${channel.name})`,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
