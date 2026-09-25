const Discord = require("discord.js");
const fetch = require("node-fetch");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const ip = interaction.options.getString("ip");

  if (ip == null)
    return client.errUsage(
      { usage: "mcstatus [ip]", type: "editreply" },
      interaction,
    );

  fetch(`https://api.mcsrvstat.us/2/${ip}`)
    .then((res) => res.json())
    .catch({})
    .then(async (json) => {
      if (!json.players)
        return client.errNormal(
          { error: "¡No encuentro el servidor!", type: "editreply" },
          interaction,
        );

      return client.embed(
        {
          title: `📁・${ip}`,
          thumbnail: `https://eu.mc-api.net/v3/server/favicon/${ip}`,
          fields: [
            {
              name: "🟢┇En línea",
              value: `${json.online}`,
              inline: true,
            },
            {
              name: "🏷️┇Versión",
              value: `${json.version}`,
              inline: true,
            },
            {
              name: "👤┇Jugadores en línea",
              value: `${json.players.online}/${json.players.max}`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    })
    .catch({});
};
