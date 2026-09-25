const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("Reproduce música en Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría música"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bassboost")
        .setDescription("Ajusta el nivel de refuerzo de graves")
        .addStringOption((option) =>
          option
            .setName("level")
            .setDescription("El nivel de refuerzo de graves")
            .setRequired(true)
            .addChoices(
              { name: "0", value: "0" },
              { name: "1", value: "1" },
              { name: "2", value: "2" },
              { name: "3", value: "3" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("play")
        .setDescription("Inicia la música")
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription("Escribe el nombre o la URL de una canción")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("clear").setDescription("Vacía la cola de música"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("loop").setDescription("Repite la música en bucle"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lyrics")
        .setDescription("Consigue la letra de la canción actual")
        .addStringOption((option) =>
          option.setName("song").setDescription("Escribe el nombre de una canción"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("playing")
        .setDescription("Mira qué canción está sonando"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("pause").setDescription("Pausa la música"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("previous").setDescription("Reproduce la canción anterior"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("queue").setDescription("Mira la cola de música"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("resume").setDescription("Reanuda la música"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Quita una canción de la cola")
        .addNumberOption((option) =>
          option
            .setName("number")
            .setDescription("Número de la canción")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("seek")
        .setDescription("Adelanta o atrasa la canción actual")
        .addNumberOption((option) =>
          option
            .setName("time")
            .setDescription("Nuevo tiempo de la canción")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("shuffle").setDescription("Mezcla la música"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("skip").setDescription("Salta la canción actual"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("skipto")
        .setDescription("Salta a otra canción")
        .addNumberOption((option) =>
          option
            .setName("number")
            .setDescription("Número de la canción")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("stop").setDescription("Detén la música"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("volume")
        .setDescription("Ajusta el volumen de la música")
        .addNumberOption((option) =>
          option.setName("amount").setDescription("Nuevo volumen"),
        ),
    ),

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    client.checkBotPerms(
      {
        flags: [
          Discord.PermissionsBitField.Flags.Connect,
          Discord.PermissionsBitField.Flags.Speak,
        ],
        perms: [
          Discord.PermissionsBitField.Flags.Connect,
          Discord.PermissionsBitField.Flags.Speak,
        ],
      },
      interaction,
    );

    client.loadSubcommands(client, interaction, args);
  },
};
