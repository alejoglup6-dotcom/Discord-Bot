const Discord = require("discord.js");

const Schema = require("../../database/models/suggestionChannels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const suggestionQuery = interaction.options.getString("suggestion");

  const data = await Schema.findOne({ Guild: interaction.guild.id });
  if (data) {
    const channel = interaction.guild.channels.cache.get(data.Channel);

    client
      .embed(
        {
          title: `💡・Sugerencia`,
          desc: `${suggestionQuery}`,
          author: {
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL({
              dynamic: true,
              size: 1024,
            }),
          },
        },
        channel,
      )
      .then((msg) => {
        client.succNormal(
          {
            text: `¡Sugerencia enviada correctamente!`,
            fields: [
              {
                name: `💬┇Sugerencia`,
                value: `${suggestionQuery}`,
                inline: true,
              },
              {
                name: `📘┇Canal`,
                value: `<#${data.Channel}>`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );

        msg.react(client.emotes.normal.arrowUp);
        msg.react(client.emotes.normal.arrowDown);
      })
      .catch((e) => {
        return client.errNormal(
          {
            error: `¡No hay canal de sugerencias configurado! Haz la configuración primero`,
            type: "editreply",
          },
          interaction,
        );
      });
  } else {
    client.errNormal(
      {
        error: `¡No hay canal de sugerencias configurado! Haz la configuración primero`,
        type: "editreply",
      },
      interaction,
    );
  }
};
