const Discord = require("discord.js");
const sourcebin = require("sourcebin");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const language = interaction.options.getString("language");
  const code = interaction.options.getString("code");

  const bin = await sourcebin
    .create(
      [
        {
          content: `${code}`,
          language: `${language}`,
        },
      ],
      {
        title: "💻・Código aleatorio",
        description: "Este código se subió a través de Bot",
      },
    )
    .then((value) => {
      client.succNormal(
        {
          text: `¡Tu código se publicó!`,
          fields: [
            {
              name: `🔗┇Enlace`,
              value: `[Haz clic aquí para ver tu código](${value.url})`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    });
};
