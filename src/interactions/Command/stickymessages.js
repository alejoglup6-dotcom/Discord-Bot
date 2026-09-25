const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stickymessages")
    .setDescription("Gestiona los mensajes fijos")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría mensajes fijos",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stick")
        .setDescription("Fija un mensaje en un canal")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Tu mensaje fijo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("messages")
        .setDescription("Muestra todos los mensajes fijos del servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unstick")
        .setDescription("Quita un mensaje fijo de un canal")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    const perms = await client.checkUserPerms(
      {
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages],
      },
      interaction,
    );

    if (perms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
