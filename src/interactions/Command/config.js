const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Ajusta el bot a tu gusto")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría de configuración"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("levels")
        .setDescription("Activa/desactiva los niveles")
        .addBooleanOption((option) =>
          option
            .setName("boolean")
            .setDescription("Elige verdadero o falso")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setcolor")
        .setDescription("Configura un color personalizado para los embeds")
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("Introduce un color")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setverify")
        .setDescription("Configura el panel de verificación")
        .addBooleanOption((option) =>
          option
            .setName("enable")
            .setDescription("Elige verdadero o falso")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Elige un canal")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Elige un rol")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setchannelname")
        .setDescription("Configura un nombre de canal para las estadísticas del servidor")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription(
              "Escribe un nombre para el canal o escribe HELP para ver las opciones",
            )
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("levelmessage")
        .setDescription("Configura el mensaje de nivel del bot")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription(
              "Escribe un mensaje para los niveles o escribe HELP para ver las opciones",
            )
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcomemessage")
        .setDescription("Configura el mensaje de bienvenida")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Escribe un mensaje de bienvenida o escribe HELP para ver las opciones")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leavemessage")
        .setDescription("Configura el mensaje de despedida")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Escribe un mensaje de despedida o escribe HELP para ver las opciones")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ticketmessage")
        .setDescription("Configura el mensaje de ticket del bot")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Tipo de mensaje de ticket")
            .setRequired(true)
            .addChoices(
              { name: "abrir", value: "open" },
              { name: "MD al cerrar", value: "close" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Escribe un mensaje para el ticket")
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
