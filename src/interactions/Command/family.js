const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

const Schema = require("../../database/models/music");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("family")
    .setDescription("Crea una familia en Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría familia"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("adopt")
        .setDescription("Adopta a un miembro")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("delete").setDescription("¡Elimina tu familia!"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("disown")
        .setDescription("Deshereda a uno de tus hijos o a uno de tus padres")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("divorce")
        .setDescription("Divórciate de tu pareja")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("family")
        .setDescription(`¡Mira quién está en la familia de alguien!`)
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("propose")
        .setDescription("Cásate con un miembro")
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
