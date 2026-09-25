const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const artist = interaction.options.getString("artist");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Artists) {
        if (data.Artists.includes(artist)) {
          return client.errNormal(
            {
              error: `¡Ese artista ya está en tu base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Artists.push(artist);
        data.save();
      } else {
        data.Artists = artist;
        data.save();
      }
      client.succNormal(
        {
          text: "Artista añadido",
          fields: [
            {
              name: "🎤┆Artista",
              value: `\`\`\`${artist}\`\`\``,
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
