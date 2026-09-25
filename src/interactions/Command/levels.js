const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");
const Schema = require("../../database/models/functions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("levels")
    .setDescription("Mira el sistema de niveles")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría niveles"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setlevel")
        .setDescription("Pon un nuevo nivel a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("level")
            .setDescription("Escribe un nuevo nivel")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deletereward")
        .setDescription("Elimina una recompensa de nivel")
        .addNumberOption((option) =>
          option
            .setName("level")
            .setDescription("Escribe un nivel")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("createreward")
        .setDescription("Crea una recompensa de nivel")
        .addNumberOption((option) =>
          option
            .setName("level")
            .setDescription("Escribe un nivel")
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
        .setName("setxp")
        .setDescription("Pon una nueva cantidad de XP a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Escribe una cantidad de XP")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rank")
        .setDescription("Mira tu rango actual")
        .addUserOption((option) =>
          option.setName("user").setDescription("Elige un usuario"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("rewards").setDescription("Muestra todas las recompensas de nivel"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Mira la clasificación de niveles"),
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    const guild = await Schema.findOne({ Guild: interaction.guild.id });
    if (!guild.Levels)
      return client.errNormal(
        {
          error: `¡El sistema de niveles está desactivado!`,
          type: "ephemeral",
        },
        interaction,
      );

    await interaction.deferReply({ withResponse: true });
    client.loadSubcommands(client, interaction, args);
  },
};
