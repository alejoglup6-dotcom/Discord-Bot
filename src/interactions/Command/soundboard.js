const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  // Meme Images

  data: new SlashCommandBuilder()
    .setName("soundboard")
    .setDescription("Reproduce todos los sonidos de Bot")

    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría soundboard",
        ),
    )

    // Windows Sounds
    .addSubcommandGroup((group) =>
      group
        .setName("windows")
        .setDescription("Reproduce los sonidos de Windows en Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("windowserror")
            .setDescription("Reproduce el sonido de error de Windows"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("windowsshutdown")
            .setDescription("Reproduce el sonido de apagado de Windows"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("windowsstartup")
            .setDescription("Reproduce el sonido de inicio de Windows"),
        ),
    )

    // Earrape Sounds

    .addSubcommandGroup((group) =>
      group
        .setName("earrape")
        .setDescription("Reproduce los sonidos a todo volumen de Bot")
        .addSubcommand((subcommand) =>
          subcommand.setName("reee").setDescription("Reproduce el sonido reee"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("defaultdance")
            .setDescription("Reproduce el sonido defaultdance"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("startup")
            .setDescription("Reproduce el sonido startup"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("thomas").setDescription("Reproduce el sonido thomas"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("wegothim")
            .setDescription("Reproduce el sonido wegothim"),
        ),
    )

    // Song Sounds

    .addSubcommandGroup((group) =>
      group
        .setName("songs")
        .setDescription("Reproduce las canciones del soundboard de Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("dancememe")
            .setDescription("Reproduce el sonido dancememe"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("despacito")
            .setDescription("Reproduce el sonido despacito"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("elevator")
            .setDescription("Reproduce el sonido elevator"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("rickastley")
            .setDescription("Reproduce el sonido rickastley"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("running")
            .setDescription("Reproduce el sonido running"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("tobecontinued")
            .setDescription("Reproduce el sonido tobecontinued"),
        ),
    )

    // Discord Sounds

    .addSubcommandGroup((group) =>
      group
        .setName("discord")
        .setDescription("Reproduce los sonidos de Discord en Bot")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("discordcall")
            .setDescription("Reproduce el sonido de llamada de Discord"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("discordjoin")
            .setDescription("Reproduce el sonido de entrar a una llamada de Discord"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("discordleave")
            .setDescription("Reproduce el sonido de salir de una llamada de Discord"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("discordnotification")
            .setDescription("Reproduce el sonido de notificación de Discord"),
        ),
    )

    // Discord Sounds

    .addSubcommandGroup((group) =>
      group
        .setName("memes")
        .setDescription("Reproduce los sonidos de memes de Bot")
        .addSubcommand((subcommand) =>
          subcommand.setName("fbi").setDescription("Reproduce el sonido fbi"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("jeff").setDescription("Reproduce el sonido jeff"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("lambo").setDescription("Reproduce el sonido lambo"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("missionfailed")
            .setDescription("Reproduce el sonido missionfailed"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("moaning").setDescription("Reproduce el sonido moaning"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("nani").setDescription("Reproduce el sonido nani"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("nyancat")
            .setDescription("Reproduce el sonido nyancat"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("ohh").setDescription("Reproduce el sonido ohh"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("rimshot")
            .setDescription("Reproduce el sonido rimshot"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("roblox").setDescription("Reproduce el sonido roblox"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("shotdown")
            .setDescription("Reproduce el sonido shotdown"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("spongebob")
            .setDescription("Reproduce el sonido spongebob"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("wow").setDescription("Reproduce el sonido wow"),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("yeet").setDescription("Reproduce el sonido yeet"),
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
