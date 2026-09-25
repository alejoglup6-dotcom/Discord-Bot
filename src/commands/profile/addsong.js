const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const song = interaction.options.getString("song");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Songs) {
        if (data.Songs.includes(song)) {
          return client.errNormal(
            {
              error: `¡Esa canción ya está en tu base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Songs.push(song);
        data.save();
      } else {
        data.Songs = song;
        data.save();
      }
      client.succNormal(
        {
          text: "Canción añadida",
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
