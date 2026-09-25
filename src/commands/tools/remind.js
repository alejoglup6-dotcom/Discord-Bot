const Discord = require("discord.js");
const Schema = require("../../database/models/reminder");
const ms = require("ms");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const time = interaction.options.getString("time");
  const text = interaction.options.getString("message");

  const endtime = new Date().getTime() + ms(time);

  Schema.findOne({
    Text: text,
    User: interaction.user.id,
    endTime: endtime,
  }).then(async (data) => {
    if (data) {
      return client.errNormal(
        { error: `¡Ya creaste este recordatorio!`, type: "editreply" },
        interaction,
      );
    } else {
      return client.succNormal(
        {
          text: `¡Tu recordatorio está listo!`,
          fields: [
            {
              name: `${client.emotes.normal.clock}┇Hora de fin`,
              value: `${new Date(endtime).toLocaleTimeString()}`,
              inline: true,
            },
            {
              name: `💭┇Recordatorio`,
              value: `${text}`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    }
  });

  setTimeout(async () => {
    client.embed(
      {
        title: `🔔・Recordatorio`,
        desc: `¡Tu recordatorio acaba de terminar!`,
        fields: [
          {
            name: `💭┇Recordatorio`,
            value: `${text}`,
            inline: true,
          },
        ],
      },
      interaction.user,
    );

    let deleted = await Schema.findOneAndDelete({
      Text: text,
      User: interaction.user.id,
      endTime: endtime,
    });
  }, endtime - new Date().getTime());
};
