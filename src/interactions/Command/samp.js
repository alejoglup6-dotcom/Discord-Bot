const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");

const nameOption = (option) =>
  option.setName("name").setDescription("Nombre de la cuenta en el juego (Nombre_Apellido)").setRequired(true).setMaxLength(24);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("samp")
    .setDescription("Tu cuenta y el servidor de SA-MP")
    .addSubcommand((subcommand) =>
      subcommand.setName("help").setDescription("Información sobre los comandos de esta categoría"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("link")
        .setDescription("Vincula tu cuenta de Discord con tu cuenta del servidor")
        .addStringOption(nameOption),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("unlink").setDescription("Desvincula tu cuenta de Discord de tu cuenta del servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("profile")
        .setDescription("Muestra el perfil de una cuenta del servidor")
        .addUserOption((option) => option.setName("user").setDescription("Miembro con la cuenta vinculada").setRequired(false))
        .addStringOption((option) =>
          option.setName("name").setDescription("Nombre de la cuenta en el juego").setRequired(false).setMaxLength(24),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("online").setDescription("Jugadores conectados ahora mismo"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("top")
        .setDescription("Ranking de jugadores del servidor")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Qué ranking quieres ver")
            .setRequired(true)
            .addChoices(
              { name: "Nivel", value: "level" },
              { name: "Dinero (efectivo + banco)", value: "money" },
              { name: "Horas jugadas", value: "hours" },
              { name: "Asesinatos", value: "kills" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ban")
        .setDescription("Banea una cuenta del servidor para siempre (Administrador)")
        .addStringOption(nameOption)
        .addStringOption((option) => option.setName("reason").setDescription("Razón del baneo").setRequired(true).setMaxLength(80)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("tempban")
        .setDescription("Banea una cuenta del servidor durante unos días (Operador)")
        .addStringOption(nameOption)
        .addIntegerOption((option) =>
          option.setName("days").setDescription("Días de baneo").setRequired(true).setMinValue(1).setMaxValue(9999),
        )
        .addStringOption((option) => option.setName("reason").setDescription("Razón del baneo").setRequired(true).setMaxLength(80)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unban")
        .setDescription("Quita el baneo de una cuenta del servidor (Operador)")
        .addStringOption(nameOption),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mute")
        .setDescription("Silencia a un jugador en el canal de dudas (Ayudante)")
        .addStringOption(nameOption)
        .addIntegerOption((option) =>
          option.setName("minutes").setDescription("Minutos de silencio").setRequired(true).setMinValue(1).setMaxValue(1440),
        )
        .addStringOption((option) => option.setName("reason").setDescription("Razón del silencio").setRequired(true).setMaxLength(80)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unmute")
        .setDescription("Quita el silencio del canal de dudas a un jugador (Ayudante)")
        .addStringOption(nameOption),
    ),

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */
  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    if (!(await client.samp.available(interaction))) return;
    client.loadSubcommands(client, interaction, args);
  },
};
