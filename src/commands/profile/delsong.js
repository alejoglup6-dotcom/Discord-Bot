const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const song = interaction.options.getString("song");
  const user = { User: interaction.user.id };

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Songs) {
        if (!data.Songs.includes(song)) {
          return client.errNormal(
            {
              error: `¡Esa canción no está en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Songs.filter((target) => target !== song);

        await Schema.findOneAndUpdate(user, {
          Songs: filtered,
        });
      }
      client.succNormal(
        {
          text: "Canción eliminada",
          fields: [
            {
              name: "🎶┆Canción",
              value: `\`\`\`${song}\`\`\``,
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
