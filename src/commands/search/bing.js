const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let name = encodeURIComponent(interaction.options.getString("name"));
  let link = `https://www.bing.com/search?q=${name}`;

  client.succNormal(
    {
      text: `Encontré lo siguiente para: \`${name}\``,
      fields: [
        {
          name: `🔗┇Enlace`,
          value: `[Haz clic aquí para ver el enlace](${link})`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
