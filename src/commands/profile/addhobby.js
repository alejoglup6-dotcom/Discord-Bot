const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const hobby = interaction.options.getString("hobby");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Hobbys) {
        if (data.Hobbys.includes(hobby)) {
          return client.errNormal(
            {
              error: `¡Ese pasatiempo ya está en tu base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }
        data.Hobbys.push(hobby);
        data.save();
      } else {
        data.Hobbys = hobby;
        data.save();
      }
      client.succNormal(
        {
          text: "Pasatiempo añadido",
          fields: [
            {
              name: "⚽┆Pasatiempo",
              value: `\`\`\`${hobby}\`\`\``,
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
