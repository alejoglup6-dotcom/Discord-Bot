const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bot")
    .setDescription("Información sobre el bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Consigue información sobre el bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("ping").setDescription("Mira el ping del bot en ms"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("changelogs")
        .setDescription("Mira el registro de cambios del bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("donate").setDescription("Consigue el enlace de donación de Bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("links")
        .setDescription("Recibe un mensaje con todos los enlaces de Bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("owner").setDescription("Información sobre el dueño"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("socials").setDescription("Mira las redes sociales de Bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("support")
        .setDescription("Consigue una invitación al servidor de soporte"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("uptime").setDescription("Muestra el tiempo activo del bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("vote").setDescription("Mira si ya votaste"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("feedback")
        .setDescription("Envía tu opinión sobre el bot a los desarrolladores")
        .addStringOption((option) =>
          option
            .setName("feedback")
            .setDescription("Tus comentarios")
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
