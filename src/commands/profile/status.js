const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const status = interaction.options.getString("text");

  if (status.length > 30)
    return client.errNormal(
      {
        error: "Tu estado no puede tener más de 30 caracteres",
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      data.Status = status;
      data.save();

      client.succNormal(
        {
          text: "Tu estado se guardó",
          fields: [
            {
              name: "😎┆Estado",
              value: `\`\`\`${status}\`\`\``,
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
