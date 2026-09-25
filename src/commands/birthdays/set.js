const Discord = require("discord.js");

const Schema = require("../../database/models/birthday");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const months = {
    1: "enero",
    2: "febrero",
    3: "marzo",
    4: "abril",
    5: "mayo",
    6: "junio",
    7: "julio",
    8: "agosto",
    9: "septiembre",
    10: "octubre",
    11: "noviembre",
    12: "diciembre",
  };

  const day = interaction.options.getNumber("day");
  const month = interaction.options.getNumber("month");

  if (!day || day > 31)
    return client.errNormal(
      {
        error: "¡Formato de día incorrecto!",
        type: "editreply",
      },
      interaction,
    );

  if (!month || month > 12)
    return client.errNormal(
      {
        error: "¡Formato de mes incorrecto!",
        type: "editreply",
      },
      interaction,
    );

  const convertedDay = suffixes(day);
  const convertedMonth = months[month];
  const birthdayString = `${convertedDay} de ${convertedMonth}`;

  Schema.findOne({
    Guild: interaction.guild.id,
    User: interaction.user.id,
  }).then(async (data) => {
    if (data) {
      data.Birthday = birthdayString;
      data.save();
    } else {
      new Schema({
        Guild: interaction.guild.id,
        User: interaction.user.id,
        Birthday: birthdayString,
      }).save();
    }
  });

  client.succNormal(
    {
      text: `El cumpleaños se guardó correctamente`,
      fields: [
        {
          name: `${client.emotes.normal.birthday}┆Cumpleaños`,
          value: `${birthdayString}`,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};

function suffixes(number) {
  const converted = number.toString();

  return converted;
}
