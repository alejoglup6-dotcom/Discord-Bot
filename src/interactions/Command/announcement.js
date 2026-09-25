const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder, ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announcement")
    .setDescription("Gestiona los anuncios del servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría de anuncios",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Haz un anuncio")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
            .addChannelTypes(ChannelType.GuildNews),
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("El mensaje de tu anuncio")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edita un anuncio")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID del anuncio que quieres cambiar")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("El mensaje de tu anuncio")
            .setRequired(true),
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
