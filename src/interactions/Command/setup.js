const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Gestiona las configuraciones de Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría configuración"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("tickets")
        .setDescription("Configura los tickets")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription(
              "Elige una categoría donde se crearán los tickets",
            )
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory),
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Elige el rol de soporte")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("El canal para el panel de tickets")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        )
        .addChannelOption((option) =>
          option
            .setName("logs")
            .setDescription("El canal para los registros de tickets")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("customvoice")
        .setDescription("Configura los canales de voz personalizados")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("Elige una categoría donde se crearán los canales")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory),
        )
        .addStringOption((option) =>
          option
            .setName("channelname")
            .setDescription("La plantilla para los nombres de los canales")
            .setRequired(true),
        ),
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
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("El canal para los registros")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
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
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("El canal de diversión")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
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
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("El canal del juego")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcomechannels")
        .setDescription("Configura los canales de bienvenida")
        .addStringOption((option) =>
          option
            .setName("setup")
            .setDescription("La configuración que quieres")
            .setRequired(true)
            .addChoices(
              { name: "Canal de bienvenida", value: "welcomechannel" },
              { name: "Canal de despedida", value: "leavechannel" },
            ),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("El canal que quieres")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcomerole")
        .setDescription("Configura el rol de bienvenida")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("El rol que quieres")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ticketpanel")
        .setDescription("Configura el panel de tickets")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("El nombre del panel de tickets")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("La descripción del panel de tickets")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deletesetup")
        .setDescription("Elimina una configuración de Bot")
        .addStringOption((option) =>
          option
            .setName("setup")
            .setDescription("La configuración que quieres")
            .setRequired(true)
            .addChoices(
              { name: "Tickets", value: "tickets" },
              { name: "Voz personalizada", value: "customvoice" },
              { name: "Registros del servidor", value: "serverlogs" },
              { name: "Registros de niveles", value: "levellogs" },
              { name: "Registros de boosts", value: "boostlogs" },
              { name: "Cumpleaños", value: "birthdays" },
              { name: "Chatbot", value: "chatbot" },
              { name: "Reseñas", value: "reviews" },
              { name: "Sugerencias", value: "suggestions" },
              { name: "Contar", value: "counting" },
              { name: "Adivina el número", value: "gtn" },
              { name: "Adivina la palabra", value: "gtw" },
              { name: "Canal de bienvenida", value: "welcomechannel" },
              { name: "Canal de despedida", value: "leavechannel" },
              { name: "Rol de bienvenida", value: "welcomerole" },
              { name: "Serpiente de palabras", value: "wordsnake" },
            ),
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
        flags: [Discord.PermissionsBitField.Flags.Administrator],
        perms: [Discord.PermissionsBitField.Flags.Administrator],
      },
      interaction,
    );

    if (perms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
