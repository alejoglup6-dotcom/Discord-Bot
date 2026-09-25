const Discord = require("discord.js");
const Topgg = require(`@top-gg/sdk`);
const moment = require("moment");
require("moment-duration-format");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let dbl = new Topgg.Api(process.env.TOPGG_TOKEN);

  let row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setLabel("Vota por mí")
      .setURL(`https://top.gg/bot/${process.env.BOT_ID}/vote`)
      .setStyle(Discord.ButtonStyle.Link),
  );

  dbl
    .getVote(interaction.user.id)
    .then((voted) => {
      if (voted) {
        client.embed(
          {
            title: `📨・Votar`,
            desc: `¡Ya votaste!`,
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874694192755007509/Bot_banner_vote.jpg`,
            color: client.config.colors.succes,
            components: [row],
            type: "editreply",
          },
          interaction,
        );
      }
      if (!voted) {
        client.embed(
          {
            title: `📨・Votar`,
            desc: `¡Todavía no has votado!`,
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874694192755007509/Bot_banner_vote.jpg`,
            color: client.config.colors.error,
            components: [row],
            type: "editreply",
          },
          interaction,
        );
      }
    })
    .catch((error) => {
      client.errNormal(
        { text: `¡Hubo un error al comprobar este voto!`, editreply: true },
        interaction,
      );
    });
};
