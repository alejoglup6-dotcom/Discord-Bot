const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const joined = interaction.options.getString("bday");
  const split = joined.trim().split("/");

  let [day, month] = split;

  if (!day || !month)
    return client.errUsage(
      { usage: "setbday [día]/[mes]", type: "editreply" },
      interaction,
    );

  if (isNaN(day) || isNaN(month)) {
    return client.errNormal(
      { error: "La fecha que diste no es un número válido", type: "editreply" },
      interaction,
    );
  }

  day = parseInt(day);
  month = parseInt(month);

  if (!day || day > 31)
    return client.errNormal(
      { error: "¡Formato de día incorrecto!", type: "editreply" },
      interaction,
    );
  if (!month || month > 12)
    return client.errNormal(
      { error: "¡Formato de mes incorrecto!", type: "editreply" },
      interaction,
    );

  const bday = `${day}/${month}`;

  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      data.Birthday = bday;
      data.save();

      client.succNormal(
        {
          text: "Tu cumpleaños se guardó",
          fields: [
            {
              name: "🎂┆Cumpleaños",
              value: `\`\`\`${bday}\`\`\``,
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
