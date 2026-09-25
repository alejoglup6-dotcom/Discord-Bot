const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverstats")
    .setDescription("Gestiona las estadísticas del servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría estadísticas del servidor",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("boosts")
        .setDescription("Lleva la cuenta de los boosts"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("tier")
        .setDescription("Lleva la cuenta del nivel de boost"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels")
        .setDescription("Lleva la cuenta de los canales"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stage-channels")
        .setDescription("Lleva la cuenta de los canales de escenario"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("text-channels")
        .setDescription("Lleva la cuenta de los canales de texto"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("voice-channels")
        .setDescription("Lleva la cuenta de los canales de voz"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("news-channels")
        .setDescription("Lleva la cuenta de los canales de anuncios"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("members")
        .setDescription("Lleva la cuenta de los miembros"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("bots").setDescription("Lleva la cuenta de los bots"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("roles")
        .setDescription("Lleva la cuenta de los roles"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("emoji")
        .setDescription("Lleva la cuenta de los emojis"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("static-emoji")
        .setDescription("Lleva la cuenta de los emojis estáticos"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("animated-emoji")
        .setDescription("Lleva la cuenta de los emojis animados"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("time")
        .setDescription("Muestra la hora de tu zona horaria")
        .addStringOption((option) =>
          option
            .setName("timezone")
            .setDescription(
              "La zona horaria que quieres (ej.: America/Mexico_City)",
            )
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
    const perms = await client.checkPerms(
      {
        flags: [Discord.PermissionsBitField.Flags.ManageChannels],
        perms: [Discord.PermissionsBitField.Flags.ManageChannels],
      },
      interaction,
    );

    if (perms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
