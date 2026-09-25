const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Consigue ayuda con el bot"),

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId("Bot-helppanel")
        .setPlaceholder("❌┆Nada seleccionado")
        .addOptions([
          {
            label: `Comandos`,
            description: `¡Muestra los comandos de Bot!`,
            emoji: "💻",
            value: "commands-Bothelp",
          },
          {
            label: `Invitar`,
            description: `Invita al bot a tu servidor`,
            emoji: "📨",
            value: "invite-Bothelp",
          },
          {
            label: `Servidor de soporte`,
            description: `Únete al servidor de soporte`,
            emoji: "❓",
            value: "support-Bothelp",
          },
          {
            label: `Registro de cambios`,
            description: `Muestra el registro de cambios del bot`,
            emoji: "📃",
            value: "changelogs-Bothelp",
          },
        ]),
    );

    return client.embed(
      {
        title: `❓・Panel de ayuda`,
        desc: `¡Bienvenido al panel de ayuda de Bot! Hicimos un pequeño resumen para ayudarte. Elige una opción en el menú de abajo`,
        image:
          "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
        fields: [
          {
            name: `❌┆¿El menú no funciona?`,
            value: `Prueba a enviar el comando otra vez. Si no hay reacción, ¡reporta el bug!`,
          },
          {
            name: `🪲┆¿Encontraste un bug?`,
            value: `Repórtalo con \`/report bug\``,
          },
          {
            name: `🔗┆Enlaces`,
            value: `[Invitar](${client.config.discord.botInvite}) | [Votar](https://top.gg/bot/${client.user.id}/vote)`,
          },
        ],
        components: [row],
        type: "editreply",
      },
      interaction,
    );
  },
};
