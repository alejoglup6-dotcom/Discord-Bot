const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("thanks")
    .setDescription("Mira el resumen del sistema de agradecimientos")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría agradecimientos"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check")
        .setDescription("Mira tus agradecimientos")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("thanks")
        .setDescription("Agradece a un usuario")
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
