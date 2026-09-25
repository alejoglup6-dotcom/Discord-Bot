const Discord = require("discord.js");
const pop = require("popcat-wrapper");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  await interaction.deferReply({ withResponse: true });

  const name = interaction.options.getString("name");

  const s = await pop.steam(name).catch((e) => {
    return client.errNormal(
      {
        error: "¡No se encontró la aplicación!",
        type: "editreply",
      },
      interaction,
    );
  });

  await client.embed(
    {
      title: `🎮・${s.name}`,
      thumbnail: s.thumbnail,
      fields: [
        {
          name: `💬┇Nombre`,
          value: `${s.name}`,
          inline: true,
        },
        {
          name: `📃┇Descripción`,
          value: `${s.description}`,
          inline: false,
        },
        {
          name: "💻┇Desarrolladores",
          value: `${s.developers.join(", ")}`,
          inline: true,
        },
        {
          name: "☁┇Distribuidores",
          value: `${s.publishers.join(", ")}`,
          inline: true,
        },
        {
          name: "🪙┇Precio",
          value: `${s.price}`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
