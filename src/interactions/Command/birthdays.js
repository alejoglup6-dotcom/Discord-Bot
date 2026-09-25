const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("birthdays")
    .setDescription("Consulta o registra un cumpleaños")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría de cumpleaños",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("check").setDescription("Consulta tu cumpleaños"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("delete").setDescription("Elimina tu cumpleaños"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("Mira todos los cumpleaños"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Guarda tu cumpleaños")
        .addNumberOption((option) =>
          option
            .setName("day")
            .setDescription("El día de tu cumpleaños (número)")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("month")
            .setDescription("El mes de tu cumpleaños (número)")
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
