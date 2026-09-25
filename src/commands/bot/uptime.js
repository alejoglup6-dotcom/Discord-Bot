const Discord = require("discord.js");
const moment = require("moment");
require("moment-duration-format");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const duration = moment
    .duration(client.uptime)
    .format("\`D\` [days], \`H\` [hrs], \`m\` [mins], \`s\` [secs]");
  const upvalue = (Date.now() / 1000 - client.uptime / 1000).toFixed(0);

  client.embed(
    {
      title: `${client.emotes.normal.arrowUp}・Tiempo activo`,
      desc: `Mira cuánto tiempo lleva activo el bot`,
      fields: [
        {
          name: "⌛┇Tiempo activo",
          value: `${duration}`,
          inline: true,
        },
        {
          name: "⏰┇Activo desde",
          value: `<t:${upvalue}>`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
