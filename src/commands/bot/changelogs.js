const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  client.embed(
    {
      title: "📃・Registro de cambios",
      desc: `_____`,
      thumbnail: client.user.avatarURL({ size: 1024 }),
      fields: [
        {
          name: "📃┆Registro de cambios",
          value: "15/3/2023 Dependencias actualizadas",
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
