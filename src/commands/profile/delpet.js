const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const pet = interaction.options.getString("pet");
  const user = { User: interaction.user.id };

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Pets) {
        if (!data.Pets.includes(pet)) {
          return client.errNormal(
            {
              error: `¡Esa mascota no está en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Pets.filter((target) => target !== pet);

        await Schema.findOneAndUpdate(user, {
          Pets: filtered,
        });
      }
      client.succNormal(
        {
          text: "Mascota eliminada",
          fields: [
            {
              name: "🐶┆Mascota",
              value: `\`\`\`${pet}\`\`\``,
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
