const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const aboutme = interaction.options.getString("text");

  if (aboutme.length > 1024)
    return client.errNormal(
      {
        error: "Tu 'sobre mí' no puede tener más de 1024 caracteres",
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      data.Aboutme = aboutme;
      data.save();

      client.succNormal(
        {
          text: "Tu 'sobre mí' se guardó",
          fields: [
            {
              name: "📘┆Sobre mí",
              value: `\`\`\`${aboutme}\`\`\``,
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
