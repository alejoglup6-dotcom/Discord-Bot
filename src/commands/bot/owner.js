const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  client.embed(
    {
      title: `📘・Información del dueño`,
      desc: `____________________________`,
      thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
      fields: [
        {
          name: "👑┆Nombre del dueño",
          value: `Drok`,
          inline: true,
        },
        {
          name: "🏢┆Organización",
          value: `Drok`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
