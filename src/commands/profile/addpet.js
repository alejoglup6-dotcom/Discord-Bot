const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const pet = interaction.options.getString("pet");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Pets) {
        if (data.Pets.includes(pet)) {
          return client.errNormal(
            {
              error: `¡Esa mascota ya está en tu base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Pets.push(pet);
        data.save();
      } else {
        data.Pets = pet;
        data.save();
      }
      client.succNormal(
        {
          text: "Mascota añadida",
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
