const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

const Schema = require("../../database/models/music");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Reproduce la radio en Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría radio"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("play").setDescription("Inicia la radio"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("stop").setDescription("Detén la radio"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("playing").setDescription("Muestra qué está sonando"),
    ),

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    client.checkBotPerms(
      {
        flags: [
          Discord.PermissionsBitField.Flags.Connect,
          Discord.PermissionsBitField.Flags.Speak,
        ],
        perms: [
          Discord.PermissionsBitField.Flags.Connect,
          Discord.PermissionsBitField.Flags.Speak,
        ],
      },
      interaction,
    );
    if (!interaction.member.voice.channel)
      return client.errNormal(
        {
          error: `¡No estás en un canal de voz!`,
          type: "editreply",
        },
        interaction,
      );

    client.loadSubcommands(client, interaction, args);
  },
};
