const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const country = interaction.options.getString("country");

  if (country.length > 50)
    return client.errNormal(
      {
        error: "Tu origen no puede tener más de 50 caracteres",
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      data.Orgin = country;
      data.save();

      client.succNormal(
        {
          text: "Tu origen se guardó",
          fields: [
            {
              name: "🌍┆País",
              value: `\`\`\`${country}\`\`\``,
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
