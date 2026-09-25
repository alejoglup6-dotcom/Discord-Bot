const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Gestiona el servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channelinfo")
        .setDescription("Consigue información sobre un canal")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("members")
        .setDescription("Mira cuántos miembros hay en este servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("oldestmember")
        .setDescription("Mira la cuenta más antigua del servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("roleinfo")
        .setDescription("Consigue información sobre un rol")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Elige un rol")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Consigue toda la información del servidor actual"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stealemoji")
        .setDescription("Roba un emoji")
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("Escribe el emoji que quieres robar")
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Elige un rol")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("youngestmember")
        .setDescription("Mira la cuenta más reciente del servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("userinfo")
        .setDescription("Consigue toda la información de un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("inviteinfo")
        .setDescription("Consigue toda la información de una invitación")
        .addStringOption((option) =>
          option
            .setName("invite")
            .setDescription("Escribe un código de invitación")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("emojis").setDescription("Mira los emojis del servidor"),
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    client.loadSubcommands(client, interaction, args);
  },
};
