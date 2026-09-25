const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Consigue una invitación para el bot"),

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    let row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setLabel("Invitar")
        .setURL(client.config.discord.botInvite)
        .setStyle(Discord.ButtonStyle.Link),

      new Discord.ButtonBuilder()
        .setLabel("Servidor de soporte")
        .setURL(client.config.discord.serverInvite)
        .setStyle(Discord.ButtonStyle.Link),
    );

    client.embed(
      {
        title: `📨・Invitar`,
        desc: `¡Mejora tu servidor aún más con Bot!`,
        image:
          "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
        url: client.config.discord.botInvite,
        components: [row],
        type: "editreply",
      },
      interaction,
    );
  },
};
