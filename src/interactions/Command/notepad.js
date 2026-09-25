const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("notepad")
    .setDescription("Gestiona tus notas")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de esta categoría"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Añade una nota a tu bloc de notas")
        .addStringOption((option) =>
          option.setName("note").setDescription("Tu nota").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Elimina una nota de tu bloc de notas")
        .addStringOption((option) =>
          option.setName("id").setDescription("ID de la nota").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edita una nota de tu bloc de notas")
        .addStringOption((option) =>
          option.setName("id").setDescription("ID de la nota").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("note").setDescription("Nota nueva").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("notes").setDescription("Muestra todas tus notas"),
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
