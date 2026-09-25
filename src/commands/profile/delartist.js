const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const artist = interaction.options.getString("artist");
  const user = { User: interaction.user.id };

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Artists) {
        if (!data.Artists.includes(artist)) {
          return client.errNormal(
            {
              error: `¡Ese artista no está en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Artists.filter((target) => target !== artist);

        await Schema.findOneAndUpdate(user, {
          Artists: filtered,
        });
      }
      client.succNormal(
        {
          text: "Artista eliminado",
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
