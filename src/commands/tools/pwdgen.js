const Discord = require("discord.js");
const generator = require("generate-password");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const password = generator.generate({
    length: 12,
    symbols: true,
    numbers: true,
  });

  client.succNormal(
    {
      text: `Generé una contraseña y te la envié por MD`,
      type: "editreply",
    },
    interaction,
  );

  client.succNormal(
    {
      text: `Tu contraseña generada`,
      fields: [
        {
          name: "🔑┇Contraseña",
          value: `${password}`,
          inline: true,
        },
        {
          name: "👣┇Longitud",
          value: `12`,
          inline: true,
        },
      ],
    },
    interaction.user,
  );
};
