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
          value: `Corwin`,
          inline: true,
        },
        {
          name: "🏷┆Tag de Discord",
          value: `</Corwin>#0001`,
          inline: true,
        },
        {
          name: "🏢┆Organización",
          value: `CoreWare`,
          inline: true,
        },
        {
          name: "🌐┆Sitio web",
          value: `[https://corwindev.nl](https://corwindev.nl)`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
