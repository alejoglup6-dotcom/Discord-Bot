const Schema = require("../../database/models/profile");
const isHexcolor = require("is-hexcolor");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const color = interaction.options.getString("color");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (!isHexcolor(color))
        return client.errNormal(
          {
            error: "¡No indicaste un color hexadecimal! Ejemplo: #ff0000",
            type: "editreply",
          },
          interaction,
        );

      data.Color = color;
      data.save();

      client.succNormal(
        {
          text: "Tu color favorito se guardó",
          fields: [
            {
              name: "🎨┆Color",
              value: `\`\`\`${color}\`\`\``,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    } else {
      return client.errNormal(
        {
          error: "¡No se encontró ningún perfil! Crea uno con createprofile",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
