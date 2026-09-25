const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");

module.exports = {
  // Meme Images

  data: new SlashCommandBuilder()
    .setName("images")
    .setDescription("Mira todas las imágenes de Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de esta categoría"),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("memes")
        .setDescription("Mira todos los memes de Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("clyde")
            .setDescription("Crea un mensaje personalizado de Clyde")
            .addStringOption((option) =>
              option
                .setName("text")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("drake")
            .setDescription("Crea un meme de Drake")
            .addStringOption((option) =>
              option
                .setName("text1")
                .setDescription("Escribe un texto")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("text2")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("meme").setDescription("Recibe un meme aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("pooh")
            .setDescription("Crea un meme de Pooh")
            .addStringOption((option) =>
              option
                .setName("text1")
                .setDescription("Escribe un texto")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("text2")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("trumptweet")
            .setDescription(
              "Muestra un tuit personalizado de Donald Trump con el mensaje indicado",
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
            .setName("tweet")
            .setDescription("Tuitea algo")
            .addStringOption((option) =>
              option
                .setName("text")
                .setDescription("Escribe un texto")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("wasted").setDescription("Efecto 'wasted' de GTA"),
        ),
    )

    // Animal Images

    .addSubcommandGroup((group) =>
      group
        .setName("animals")
        .setDescription("Mira todas las imágenes de animales de Bot")
        .addSubcommand((subcommand) =>
          subcommand.setName("bird").setDescription("Recibe un pájaro aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("cat").setDescription("Recibe un gato aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("dog").setDescription("Recibe un perro aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("fox").setDescription("Recibe un zorro aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("koala").setDescription("Recibe un koala aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("panda").setDescription("Recibe un panda aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("redpanda")
            .setDescription("Recibe un panda rojo aleatorio"),
        ),
    )

    // User Images

    .addSubcommandGroup((group) =>
      group
        .setName("user")
        .setDescription("Mira todas las imágenes de usuarios de Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ad")
            .setDescription("Genera una imagen de anuncio")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario para el anuncio")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("avatar")
            .setDescription("Mira el avatar de un usuario")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuyo avatar quieres ver")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("banner")
            .setDescription("Mira el banner de un usuario")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuyo banner quieres ver")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("bed")
            .setDescription("Crea un meme de la cama")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario con el que quieres dormir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("blur")
            .setDescription("Genera una imagen desenfocada")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuya imagen quieres desenfocar")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("burn")
            .setDescription("Genera una imagen quemada")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuya imagen quieres quemar")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("clown")
            .setDescription("Genera una imagen de payaso")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario que quieres convertir en payaso")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("colorify")
            .setDescription("Genera una imagen coloreada")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuya imagen quieres colorear")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("darkness")
            .setDescription("Genera una imagen oscurecida")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuya imagen quieres oscurecer")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("facepalm")
            .setDescription("Genera una imagen de facepalm")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario para el facepalm")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("greyscale")
            .setDescription("Pon una imagen en escala de grises")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuya imagen quieres en gris")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("invert")
            .setDescription("Invierte los colores de una imagen")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario cuya imagen quieres invertir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("kiss")
            .setDescription("Besa a un usuario")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario al que quieres besar")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("podium")
            .setDescription("Crea un podio de usuarios")
            .addUserOption((option) =>
              option
                .setName("user1")
                .setDescription("El primer usuario del podio")
                .setRequired(true),
            )
            .addUserOption((option) =>
              option
                .setName("user2")
                .setDescription("El segundo usuario del podio")
                .setRequired(true),
            )
            .addUserOption((option) =>
              option
                .setName("user3")
                .setDescription("El tercer usuario del podio")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("spank")
            .setDescription("Dale una nalgada a un usuario")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario al que quieres darle una nalgada")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("wanted")
            .setDescription("Pon a un usuario en un cartel de 'se busca'")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("El usuario para el cartel de 'se busca'")
                .setRequired(true),
            ),
        ),
    )

    // Extra Images

    .addSubcommandGroup((group) =>
      group
        .setName("extra")
        .setDescription("Mira todas las imágenes extra de Bot")
        .addSubcommand((subcommand) =>
          subcommand.setName("car").setDescription("Recibe un coche aleatorio"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("glass")
            .setDescription("Pon una textura de cristal sobre una imagen"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("image")
            .setDescription("Muestra una imagen en un embed")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Canal donde debe ir el embed")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText),
            )
            .addStringOption((option) =>
              option
                .setName("image-url")
                .setDescription("Escribe la URL de una imagen")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("triggered").setDescription("Ponte 'triggered'"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("wallpaper")
            .setDescription("Devuelve un fondo de pantalla de HDQWalls")
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("Escribe un nombre")
                .setRequired(true),
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
    client.loadSubcommands(client, interaction, args);
  },
};
