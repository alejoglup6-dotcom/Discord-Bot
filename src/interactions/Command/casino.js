const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("casino")
    .setDescription("Juega en el casino")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría casino"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("blackjack")
        .setDescription("Juega al blackjack para ganar dinero")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("crash")
        .setDescription("Más riesgo, más recompensa")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("roulette")
        .setDescription("Juega a la ruleta")
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("Introduce un color")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("slots")
        .setDescription("Juega a las tragamonedas")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
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
