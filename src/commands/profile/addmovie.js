const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const movie = interaction.options.getString("movie");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Movies) {
        if (data.Movies.includes(movie)) {
          return client.errNormal(
            {
              error: `¡Esa película ya está en tu base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Movies.push(movie);
        data.save();
      } else {
        data.Movies = movie;
        data.save();
      }
      client.succNormal(
        {
          text: "Película añadida",
          fields: [
            {
              name: "🎬┆Películas",
              value: `\`\`\`${movie}\`\`\``,
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
