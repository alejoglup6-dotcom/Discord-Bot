const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");
const ms = require("ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Organiza un sorteo en tu servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría sorteos"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Inicia un sorteo")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Canal donde debe ir el sorteo")
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ),
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription("Duración del sorteo")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("winners")
            .setDescription("El número de ganadores del sorteo")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("prize")
            .setDescription("El premio del sorteo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("drop")
        .setDescription("Inicia un sorteo relámpago")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Canal donde debe ir el sorteo")
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            ),
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription("Duración del sorteo")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("winners")
            .setDescription("El número de ganadores del sorteo")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("prize")
            .setDescription("El premio del sorteo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reroll")
        .setDescription("Vuelve a sortear un sorteo")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("ID del mensaje del sorteo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setDescription("Termina un sorteo")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("ID del mensaje del sorteo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edita la duración de un sorteo")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("ID del mensaje del sorteo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Elimina un sorteo")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("ID del mensaje del sorteo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pause")
        .setDescription("Pausa un sorteo")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("ID del mensaje del sorteo")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unpause")
        .setDescription("Reanuda un sorteo")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("ID del mensaje del sorteo")
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
