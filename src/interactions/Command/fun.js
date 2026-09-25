const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Usa los comandos de diversión de Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría diversión"),
    )

    // Meme Commands

    .addSubcommandGroup((group) =>
      group
        .setName("meme")
        .setDescription("Mira todos los comandos de memes de Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("confused")
            .setDescription("Reacciona con el meme de Nick Young confundido"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("cleverrate")
            .setDescription("Mira qué tan inteligente eres"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("dinochrome").setDescription("El dinosaurio de Chrome"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("epicgamerrate")
            .setDescription("Mira qué tan gamer épico eres"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("howgay").setDescription("Mira qué tan gay eres"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("roast")
            .setDescription("Humilla a un usuario")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("Elige un usuario")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("simprate").setDescription("Mira qué tan simp eres"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("stankrate")
            .setDescription("Mira qué tan apestoso eres"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("rickroll").setDescription("Recibe un rickroll"),
        ),
    )

    // User Commands

    .addSubcommandGroup((group) =>
      group
        .setName("user")
        .setDescription("Mira todos los comandos de diversión con usuarios de Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("hack")
            .setDescription("¡Hackea a tus amigos o enemigos!")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("Elige un usuario")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("hug")
            .setDescription("Dale un abrazo a un usuario")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("Elige un usuario")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("kill")
            .setDescription("Mata a un usuario")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("Elige un usuario")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("lovemeter")
            .setDescription("Mira qué tan compatible eres con alguien")
            .addUserOption((option) =>
              option
                .setName("user1")
                .setDescription("Elige un usuario")
                .setRequired(true),
            )
            .addUserOption((option) =>
              option
                .setName("user2")
                .setDescription("Elige un usuario")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("sudo")
            .setDescription("Di algo como si fueras otra persona")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("Elige un usuario")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("text")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        ),
    )

    // Text Commands

    .addSubcommandGroup((group) =>
      group
        .setName("text")
        .setDescription("Mira todos los comandos de diversión con texto de Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ascii")
            .setDescription("Crea texto ASCII")
            .addStringOption((option) =>
              option
                .setName("text")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("gif")
            .setDescription("Busca un gif")
            .addStringOption((option) =>
              option
                .setName("text")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("reverse")
            .setDescription("Invierte tu texto")
            .addStringOption((option) =>
              option
                .setName("text")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("say")
            .setDescription("Haz que el bot diga algo")
            .addStringOption((option) =>
              option
                .setName("text")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        ),
    )

    // Extra Commands

    .addSubcommandGroup((group) =>
      group
        .setName("extra")
        .setDescription("Mira todos los comandos de diversión extra de Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("birdfact")
            .setDescription("Recibe un dato aleatorio sobre aves"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("catfact").setDescription("Recibe un dato aleatorio sobre gatos"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("dogfact").setDescription("Recibe un dato aleatorio sobre perros"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("fact").setDescription("Recibe un dato aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("koalafact")
            .setDescription("Recibe un dato aleatorio sobre koalas"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("pandafact")
            .setDescription("Recibe un dato aleatorio sobre pandas"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("token").setDescription("Consigue mi token"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("worldclock")
            .setDescription("Muestra el reloj mundial"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("xmas")
            .setDescription("Mira cuántos días faltan para Navidad"),
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
