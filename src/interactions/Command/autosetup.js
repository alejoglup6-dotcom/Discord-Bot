const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autosetup")
    .setDescription("Deja que el bot se configure automáticamente")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de configuración automática"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("logs")
        .setDescription("Configura los registros del servidor")
        .addStringOption((option) =>
          option
            .setName("setup")
            .setDescription("La configuración que quieres")
            .setRequired(true)
            .addChoices(
              { name: "Registros del servidor", value: "serverLogs" },
              { name: "Registros de niveles", value: "levelLogs" },
              { name: "Registros de boosts", value: "boostLogs" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("fun")
        .setDescription("Configura los canales de diversión del servidor")
        .addStringOption((option) =>
          option
            .setName("setup")
            .setDescription("La configuración que quieres")
            .setRequired(true)
            .addChoices(
              { name: "Cumpleaños", value: "birthdays" },
              { name: "Chatbot", value: "chatbot" },
              { name: "Reseñas", value: "reviews" },
              { name: "Sugerencias", value: "suggestions" },
              { name: "Tablón de estrellas", value: "starboard" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("games")
        .setDescription("Configura los canales de juegos del servidor")
        .addStringOption((option) =>
          option
            .setName("setup")
            .setDescription("La configuración que quieres")
            .setRequired(true)
            .addChoices(
              { name: "Contar", value: "counting" },
              { name: "Adivina el número", value: "gtn" },
              { name: "Adivina la palabra", value: "gtw" },
              { name: "Serpiente de palabras", value: "wordsnake" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcome")
        .setDescription("Configura el sistema de bienvenida")
        .addStringOption((option) =>
          option
            .setName("setup")
            .setDescription("La configuración que quieres")
            .setRequired(true)
            .addChoices(
              { name: "Canal de bienvenida", value: "welcomechannel" },
              { name: "Rol de bienvenida", value: "welcomerole" },
              { name: "Canal de despedida", value: "leavechannel" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("customvoice")
        .setDescription("Configura los canales de voz personalizados del servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ticketpanel")
        .setDescription("Configura el panel de tickets del servidor"),
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
        flags: [Discord.PermissionsBitField.Flags.Administrator],
        perms: [Discord.PermissionsBitField.Flags.Administrator],
      },
      interaction,
    );

    if (perms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
