const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

const Schema = require("../../database/models/music");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Configura tu AFK")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría AFK"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Ponte AFK")
        .addStringOption((option) =>
          option.setName("reason").setDescription("La razón de tu AFK"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("Muestra todos los usuarios AFK"),
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
