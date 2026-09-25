const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const movie = interaction.options.getString("movie");
  const user = { User: interaction.user.id };

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Movies) {
        if (!data.Movies.includes(movie)) {
          return client.errNormal(
            {
              error: `¡Esa película no está en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Movies.filter((target) => target !== movie);

        await Schema.findOneAndUpdate(user, {
          Movies: filtered,
        });
      }
      client.succNormal(
        {
          text: "Película eliminada",
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
