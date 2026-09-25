const Discord = require("discord.js");

const ticketSchema = require("../../database/models/tickets");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  ticketSchema
    .findOne({ Guild: interaction.guild.id })
    .then(async (ticketData) => {
      if (ticketData) {
        const channel = interaction.guild.channels.cache.get(
          ticketData.Channel,
        );
        const button = new Discord.ButtonBuilder()
          .setCustomId("Bot_openticket")
          .setLabel("Tickets")
          .setStyle(Discord.ButtonStyle.Primary)
          .setEmoji("🎫");

        const row = new Discord.ActionRowBuilder().addComponents(button);

        client.embed(
          {
            title: "Tickets",
            desc: "Haz clic en 🎫 para abrir un ticket",
            components: [row],
          },
          channel,
        );

        client.succNormal(
          {
            text: `¡El panel de tickets se configuró correctamente!`,
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.errNormal(
          {
            error: `¡Primero ejecuta la configuración de tickets!`,
            type: "editreply",
          },
          interaction,
        );
      }
    });
};
