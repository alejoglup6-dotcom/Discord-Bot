const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("games")
    .setDescription("Juega a juegos en Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría juegos"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("8ball")
        .setDescription("Hazle una pregunta al bot")
        .addStringOption((option) =>
          option
            .setName("question")
            .setDescription("La pregunta que quieres hacer")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("fasttype").setDescription("Aprende a escribir más rápido"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("roll").setDescription("Tira un dado"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rps")
        .setDescription("Juega a piedra, papel o tijera contra el bot")
        .addStringOption((option) =>
          option
            .setName("option")
            .setDescription("Elige lo que quieres")
            .setRequired(true)
            .addChoices(
              { name: "🪨 Piedra", value: "rock" },
              { name: "📃 Papel", value: "paper" },
              { name: "✂️ Tijera", value: "scissors" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("skipword").setDescription("Salta la palabra actual"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("snake").setDescription("Juega a la serpiente"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("trivia").setDescription("Juega a trivia"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("willyoupressthebutton")
        .setDescription("Juega a ¿Pulsarías el botón?"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("wouldyourather")
        .setDescription("Juega a ¿Qué prefieres?"),
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
