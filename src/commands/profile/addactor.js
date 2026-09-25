const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const actor = interaction.options.getString("actor");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Actors) {
        if (data.Actors.includes(actor)) {
          return client.errNormal(
            {
              error: `¡Ese actor ya está en tu base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Actors.push(actor);
        data.save();
      } else {
        data.Actors = actor;
        data.save();
      }
      client.succNormal(
        {
          text: "Actor añadido",
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
