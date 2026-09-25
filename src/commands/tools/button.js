const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const url = interaction.options.getString("url");
  const text = interaction.options.getString("text");

  if (text.length > 50)
    return client.errNormal(
      {
        error: "El texto de tu botón no puede tener más de 50 caracteres",
        type: "editreply",
      },
      interaction,
    );

  let button = new Discord.ButtonBuilder()
    .setLabel(`${text}`)
    .setURL(`${url}`)
    .setStyle(Discord.ButtonStyle.Link);

  let row = new Discord.ActionRowBuilder().addComponents(button);

  client.embed(
    {
      title: `🔗・${text}`,
      desc: `¡Haz clic en el botón para abrir el enlace!`,
      components: [row],
      type: "editreply",
    },
    interaction,
  );
};
