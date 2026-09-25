const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const food = interaction.options.getString("food");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Food) {
        if (data.Food.includes(food)) {
          return client.errNormal(
            {
              error: `¡Esa comida ya está en tu base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Food.push(food);
        data.save();
      } else {
        data.Food = food;
        data.save();
      }
      client.succNormal(
        {
          text: "Comida añadida",
          fields: [
            {
              name: "🥐┆Comida",
              value: `\`\`\`${food}\`\`\``,
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
