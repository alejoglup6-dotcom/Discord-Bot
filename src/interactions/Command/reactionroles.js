const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reactionroles")
    .setDescription("Gestiona los roles por reacción del servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría roles por reacción",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Añade un rol por reacción")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Nombre de la categoría para tu grupo de roles por reacción")
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Elige un rol")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("Escribe un emoji")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Elimina una categoría de roles por reacción")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Nombre de la categoría para tu grupo de roles por reacción")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Muestra todas las categorías de roles por reacción del servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("button")
        .setDescription("Muestra todos los roles por reacción con botones")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Nombre de la categoría para tu grupo de roles por reacción")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Canal donde deben ir los roles por reacción")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("menu")
        .setDescription("Muestra todos los roles por reacción en un menú")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Nombre de la categoría para tu grupo de roles por reacción")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Canal donde deben ir los roles por reacción")
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
    const perms = await client.checkPerms(
      {
        flags: [Discord.PermissionsBitField.Flags.ManageRoles],
        perms: [Discord.PermissionsBitField.Flags.ManageRoles],
      },
      interaction,
    );

    if (perms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
