const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tools")
    .setDescription("Usa algunas herramientas útiles")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría herramientas"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("anagram")
        .setDescription("Forma una palabra con ciertas letras")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("La palabra que quieres formar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("button")
        .setDescription("Crea un botón")
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription("La URL del botón")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("El texto del botón")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("calculator").setDescription("Calcula una operación"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("decode")
        .setDescription("Decodifica código binario a texto")
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("El código binario que quieres decodificar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("emojify")
        .setDescription("Convierte texto en emojis")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("El texto que quieres convertir")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("encode")
        .setDescription("Codifica texto a código binario")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("El texto que quieres codificar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enlarge")
        .setDescription("Agranda un emoji")
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("El emoji que quieres agrandar")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mcskin")
        .setDescription("Mira la skin de un usuario de Minecraft")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("El nombre de usuario del jugador")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mcstatus")
        .setDescription("Mira el estado de un servidor de Minecraft")
        .addStringOption((option) =>
          option
            .setName("ip")
            .setDescription("La IP del servidor de Minecraft")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("pwdgen").setDescription("Genera una contraseña"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("qrcode")
        .setDescription("Envía un código QR con el texto que indiques")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("El texto que quieres convertir")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remind")
        .setDescription("Crea un recordatorio")
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription("El tiempo para tu recordatorio")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("El mensaje de tu recordatorio")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sourcebin")
        .setDescription("Sube código a sourcebin")
        .addStringOption((option) =>
          option
            .setName("language")
            .setDescription("El lenguaje de tu código")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("code").setDescription("Tu código").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("url")
        .setDescription("Crea una URL acortada")
        .addStringOption((option) =>
          option
            .setName("site")
            .setDescription("El enlace al sitio web")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("code")
            .setDescription("El código para la URL")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("review")
        .setDescription("Escribe una reseña")
        .addNumberOption((option) =>
          option
            .setName("stars")
            .setDescription("El número de estrellas (máx. 5)")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Una breve descripción para la reseña"),
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
