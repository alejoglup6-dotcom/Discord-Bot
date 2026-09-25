const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");
const ms = require("ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Crea un perfil para el servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría perfil"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("create").setDescription("Crea tu perfil"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("delete").setDescription("Elimina tu perfil"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("profile")
        .setDescription("Mira tu perfil")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("El usuario cuyo perfil quieres ver")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("aboutme")
        .setDescription("Configura tu 'sobre mí'")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("Escribe tu 'sobre mí'")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("age")
        .setDescription("Configura tu edad")
        .addNumberOption((option) =>
          option
            .setName("number")
            .setDescription("Escribe un número")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bday")
        .setDescription("Configura tu cumpleaños")
        .addStringOption((option) =>
          option
            .setName("bday")
            .setDescription("Escribe tu cumpleaños")
            .setRequired(true),
        ),
    )

    .addSubcommandGroup((group) =>
      group
        .setName("actor")
        .setDescription("Configura tu actor favorito")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addactor")
            .setDescription("El actor que quieres añadir")
            .addStringOption((option) =>
              option
                .setName("actor")
                .setDescription("El actor que quieres añadir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delactor")
            .setDescription("El actor que quieres quitar")
            .addStringOption((option) =>
              option
                .setName("actor")
                .setDescription("El actor que quieres quitar")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("artist")
        .setDescription("Configura tu artista favorito")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addartist")
            .setDescription("El artista que quieres añadir")
            .addStringOption((option) =>
              option
                .setName("artist")
                .setDescription("El artista que quieres añadir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delartist")
            .setDescription("El artista que quieres quitar")
            .addStringOption((option) =>
              option
                .setName("artist")
                .setDescription("El artista que quieres quitar")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("color")
        .setDescription("Configura tu color favorito")
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("El color que quieres poner")
            .setRequired(true),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("food")
        .setDescription("Configura tu comida favorita")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addfood")
            .setDescription("La comida que quieres añadir")
            .addStringOption((option) =>
              option
                .setName("food")
                .setDescription("La comida que quieres añadir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delfood")
            .setDescription("La comida que quieres quitar")
            .addStringOption((option) =>
              option
                .setName("food")
                .setDescription("La comida que quieres quitar")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("movie")
        .setDescription("Configura tu película favorita")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addmovie")
            .setDescription("La película que quieres añadir")
            .addStringOption((option) =>
              option
                .setName("movie")
                .setDescription("La película que quieres añadir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delmovie")
            .setDescription("La película que quieres quitar")
            .addStringOption((option) =>
              option
                .setName("movie")
                .setDescription("La película que quieres quitar")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("pet")
        .setDescription("Configura tu mascota favorita")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addpet")
            .setDescription("La mascota que quieres añadir")
            .addStringOption((option) =>
              option
                .setName("pet")
                .setDescription("La mascota que quieres añadir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delpet")
            .setDescription("La mascota que quieres quitar")
            .addStringOption((option) =>
              option
                .setName("pet")
                .setDescription("La mascota que quieres quitar")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("song")
        .setDescription("Configura tu canción favorita")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addsong")
            .setDescription("La canción que quieres añadir")
            .addStringOption((option) =>
              option
                .setName("song")
                .setDescription("La canción que quieres añadir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delsong")
            .setDescription("La canción que quieres quitar")
            .addStringOption((option) =>
              option
                .setName("song")
                .setDescription("La canción que quieres quitar")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("gender").setDescription("Configura tu género"),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("hobbies")
        .setDescription("Configura tu pasatiempo favorito")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("addhobby")
            .setDescription("La canción que quieres añadir")
            .addStringOption((option) =>
              option
                .setName("hobby")
                .setDescription("El pasatiempo que quieres añadir")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delhobby")
            .setDescription("El pasatiempo que quieres quitar")
            .addStringOption((option) =>
              option
                .setName("hobby")
                .setDescription("El pasatiempo que quieres quitar")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("origin")
        .setDescription("Configura tu origen")
        .addStringOption((option) =>
          option
            .setName("country")
            .setDescription("Escribe un país")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Configura tu estado")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("Escribe un estado")
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
