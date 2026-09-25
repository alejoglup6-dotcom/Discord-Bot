const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggestions")
    .setDescription("Gestiona las sugerencias")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría sugerencias",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("accept")
        .setDescription("Acepta una sugerencia")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID del mensaje de la sugerencia")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deny")
        .setDescription("Rechaza una sugerencia")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID del mensaje de la sugerencia")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Envía una sugerencia")
        .addStringOption((option) =>
          option
            .setName("suggestion")
            .setDescription("Tu sugerencia")
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
