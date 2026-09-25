const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const actor = interaction.options.getString("actor");
  const user = { User: interaction.user.id };

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Actors) {
        if (!data.Actors.includes(actor)) {
          return client.errNormal(
            {
              error: `¡Ese actor no está en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Actors.filter((target) => target !== actor);

        await Schema.findOneAndUpdate(user, {
          Actors: filtered,
        });
      }
      client.succNormal(
        {
          text: "Actor eliminado",
          fields: [
            {
              name: "👨‍🎤┆Actor",
              value: `\`\`\`${actor}\`\`\``,
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
