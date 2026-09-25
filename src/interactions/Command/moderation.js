const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moderation")
    .setDescription("Gestiona toda la moderación del servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría moderación",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ban")
        .setDescription("Banea a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("La razón del baneo"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Elimina mensajes")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Cantidad de mensajes")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clearuser")
        .setDescription("Elimina los mensajes de un usuario en un canal")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("demote")
        .setDescription("Degrada a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Expulsa a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("La razón de la expulsión"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lock")
        .setDescription("Bloquea un canal")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("lockdown").setDescription("Bloquea todos los canales"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("nuke").setDescription("Destruye y recrea un canal"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("softban")
        .setDescription("Hace softban a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("La razón del baneo"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("timeout")
        .setDescription("Aísla a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("time")
            .setDescription("Número de minutos")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Razón del aislamiento")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("tempban")
        .setDescription("Banea temporalmente a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("time")
            .setDescription("Número de minutos")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("La razón del baneo"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unlock")
        .setDescription("Desbloquea un canal")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unban")
        .setDescription("Desbanea a un usuario")
        .addStringOption((option) =>
          option
            .setName("user")
            .setDescription("Indica el ID de un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("banlist").setDescription("Mira todos los usuarios baneados"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("warn")
        .setDescription("Advierte a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("La razón de la advertencia")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unwarn")
        .setDescription("Retira una advertencia a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("case")
            .setDescription("Indica un número de caso")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("warnings")
        .setDescription("Mira las advertencias de un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
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
    client.loadSubcommands(client, interaction, args);
  },
};
