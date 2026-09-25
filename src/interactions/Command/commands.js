const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

const Schema = require("../../database/models/music");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("custom-commands")
    .setDescription("Crea comandos personalizados")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre la categoría de comandos personalizados"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Crea un comando personalizado")
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("El nombre del comando")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("La respuesta del comando")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Elimina un comando personalizado")
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("El nombre del comando")
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
    const perms = await client.checkUserPerms(
      {
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages],
      },
      interaction,
    );

    if (perms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
