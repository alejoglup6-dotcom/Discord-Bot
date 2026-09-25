const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const age = interaction.options.getNumber("number");

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      if (isNaN(age))
        return client.errNormal(
          { error: "No indicaste un número válido", type: "editreply" },
          interaction,
        );

      data.Age = age;
      data.save();

      client.succNormal(
        {
          text: "Tu edad se guardó",
          fields: [
            {
              name: "📆┆Edad",
              value: `\`\`\`${age}\`\`\``,
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
