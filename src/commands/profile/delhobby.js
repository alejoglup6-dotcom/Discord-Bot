const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const hobby = interaction.options.getString("hobby");
  const user = { User: interaction.user.id };

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (data && data.Hobbys) {
        if (!data.Hobbys.includes(hobby)) {
          return client.errNormal(
            {
              error: `¡Ese pasatiempo no está en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Hobbys.filter((target) => target !== hobby);

        await Schema.findOneAndUpdate(user, {
          Hobbys: filtered,
        });
      }
      client.succNormal(
        {
          text: "Pasatiempo eliminado",
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
