const Discord = require("discord.js");
const odm = require("../../database/odm");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  client
    .simpleEmbed(
      {
        desc: `${client.emotes.animated.loading} Calculando el ping...`,
        type: "editreply",
      },
      interaction,
    )
    .then((resultMessage) => {
      const ping = Math.floor(
        resultMessage.createdTimestamp - interaction.createdTimestamp,
      );

      odm.ping().catch(() => -1).then((dbPing) => {
        var dbSeconds = (dbPing % 60000) / 1000;
        var pingSeconds = (ping % 60000) / 1000;
        var apiSeconds = (client.ws.ping % 60000) / 1000;

        client.embed(
          {
            title: `${client.emotes.normal.pong}・Pong`,
            desc: `Mira qué tan rápido es nuestro bot`,
            fields: [
              {
                name: "🤖┆Latencia del bot",
                value: `${ping}ms (${pingSeconds}s)`,
                inline: true,
              },
              {
                name: "💻┆Latencia de la API",
                value: `${client.ws.ping}ms (${apiSeconds}s)`,
                inline: true,
              },
              {
                name: "📂┆Latencia de la base de datos",
                value: dbPing < 0 ? "Sin conexión" : `${dbPing}ms (${dbSeconds}s)`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      });
    });
};
