const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Busca algo en internet")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de esta categoría"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bing")
        .setDescription("Busca algo en Bing")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Lo que quieres buscar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ddg")
        .setDescription("Busca algo en DuckDuckGo")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Lo que quieres buscar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("google")
        .setDescription("Busca algo en Google")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Lo que quieres buscar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("youtube")
        .setDescription("Busca algo en YouTube")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Lo que quieres buscar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("corona")
        .setDescription("Mira las estadísticas del coronavirus")
        .addStringOption((option) =>
          option
            .setName("country")
            .setDescription("Escribe un país")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("crypto")
        .setDescription("Mira el valor de una criptomoneda")
        .addStringOption((option) =>
          option
            .setName("coin")
            .setDescription("Escribe una moneda")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("currency")
            .setDescription("Escribe una divisa")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("docs")
        .setDescription("Mira la documentación de discord.js")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Lo que quieres buscar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("github")
        .setDescription(
          "Consigue información de un usuario de GitHub con su nombre de usuario",
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Escribe un nombre de GitHub")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("hexcolour")
        .setDescription("Consigue información de un color")
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("Introduce un color")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("itunes")
        .setDescription("Busca cualquier canción en iTunes")
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription("Escribe el nombre de una canción")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("npm")
        .setDescription("Consigue información de un paquete de NPM")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Escribe el nombre de un paquete")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("steam")
        .setDescription("Consigue información de una aplicación de Steam")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Escribe el nombre de una aplicación de Steam")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("translate")
        .setDescription("Traduce un texto")
        .addStringOption((option) =>
          option
            .setName("language")
            .setDescription("Escribe un idioma")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("Escribe un texto")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("weather")
        .setDescription("Mira el clima actual")
        .addStringOption((option) =>
          option
            .setName("location")
            .setDescription("Escribe el nombre de un lugar")
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
