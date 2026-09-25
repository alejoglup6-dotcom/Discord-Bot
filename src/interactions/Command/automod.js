const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Gestiona la automoderación")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de configuración automática"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("antiinvite")
        .setDescription("Activa/desactiva el anti-invitaciones")
        .addBooleanOption((option) =>
          option
            .setName("active")
            .setDescription("Elige verdadero o falso")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("antilinks")
        .setDescription("Activa/desactiva el anti-enlaces")
        .addBooleanOption((option) =>
          option
            .setName("active")
            .setDescription("Elige verdadero o falso")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("antispam")
        .setDescription("Activa/desactiva el anti-spam")
        .addBooleanOption((option) =>
          option
            .setName("active")
            .setDescription("Elige verdadero o falso")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("linkschannel")
        .setDescription("Añade un canal donde se permite enviar enlaces")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("¿Qué quieres hacer con el canal?")
            .setRequired(true)
            .addChoices(
              { name: "Añadir", value: "add" },
              { name: "Quitar", value: "remove" },
            ),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("blacklist")
        .setDescription("Gestiona la lista negra")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("display")
            .setDescription("Muestra toda la lista negra"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Añade una palabra a la lista negra")
            .addStringOption((option) =>
              option
                .setName("word")
                .setDescription("La palabra para la lista negra")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Quita una palabra de la lista negra")
            .addStringOption((option) =>
              option
                .setName("word")
                .setDescription("La palabra para la lista negra")
                .setRequired(true),
            ),
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
