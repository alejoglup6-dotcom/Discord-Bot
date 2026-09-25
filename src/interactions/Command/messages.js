const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("messages")
    .setDescription("Mira el sistema de mensajes")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de esta categoría"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Añade mensajes a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Escribe una cantidad de mensajes")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deletereward")
        .setDescription("Elimina una recompensa por mensajes")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Escribe una cantidad de mensajes")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("createreward")
        .setDescription("Crea una recompensa por mensajes")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Escribe una cantidad de mensajes")
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("El rol de esta recompensa")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Quita mensajes a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Escribe una cantidad de mensajes")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Mira tus mensajes")
        .addUserOption((option) =>
          option.setName("user").setDescription("Elige un usuario"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("rewards").setDescription("Muestra todas las recompensas por mensajes"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Mira la clasificación de mensajes"),
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
