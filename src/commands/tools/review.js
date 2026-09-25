const Discord = require("discord.js");

const Schema = require("../../database/models/reviewChannels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const stars = interaction.options.getNumber("stars");
  const message = interaction.options.getString("message") || "No indicada";

  if (stars < 1 || stars > 5)
    return client.errNormal(
      {
        error: `Las estrellas deben ser mínimo 1 y máximo 5`,
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (data) {
      const channel = interaction.member.guild.channels.cache.get(data.Channel);
      if (!channel)
        return client.errNormal(
          {
            error: `¡No hay canal de reseñas configurado! Usa \`reviewchannel\``,
            type: "editreply",
          },
          interaction,
        );

      let totalStars = "";
      for (let i = 0; i < stars; i++) {
        totalStars += ":star:";
      }

      client.succNormal(
        {
          text: "Tu reseña se envió correctamente",
          fields: [
            {
              name: `⭐┇Estrellas`,
              value: `${stars}`,
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

      client.embed(
        {
          title: `Reseña・${interaction.user.tag}`,
          desc: `¡Se escribió una nueva reseña!`,
          fields: [
            {
              name: "Estrellas",
              value: `${totalStars}`,
              inline: true,
            },
            {
              name: "Nota",
              value: `${message}`,
              inline: true,
            },
          ],
        },
        channel,
      );
    } else {
      client.errNormal(
        {
          error: `¡No hay canal de reseñas configurado! Usa \`reviewchannel\``,
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
