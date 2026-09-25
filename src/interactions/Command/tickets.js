const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tickets")
    .setDescription("Gestiona los tickets de tu servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría tickets"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Añade a un usuario a un ticket")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("claim").setDescription("Reclama un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("close").setDescription("Cierra un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("delete").setDescription("Elimina un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("information")
        .setDescription("Información sobre un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("lower").setDescription("Baja la prioridad de un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Crea un ticket")
        .addStringOption((option) =>
          option.setName("reason").setDescription("Razón para abrir un ticket"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("notice").setDescription("Envía un aviso a un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("open").setDescription("Reabre un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("raise").setDescription("Sube la prioridad de un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Quita a un usuario de un ticket")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rename")
        .setDescription("Renombra un ticket")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Nuevo nombre del ticket")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("transcript").setDescription("Guarda la transcripción de un ticket"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("unclaim").setDescription("Libera un ticket reclamado"),
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
