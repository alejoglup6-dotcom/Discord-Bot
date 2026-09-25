const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("economy")
    .setDescription("Juega a la economía en tu servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription("Información sobre los comandos de la categoría de economía"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("additem")
        .setDescription("Añade un rol como artículo en la tienda")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Elige un rol")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("addmoney")
        .setDescription("Dale dinero a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("balance")
        .setDescription("Mira tu saldo")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("beg").setDescription("Mendiga dinero"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("buy").setDescription("Compra artículos en la tienda de Bot"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("clear").setDescription("Reinicia la economía"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("crime").setDescription("Comete un crimen"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("daily").setDescription("Recoge tu dinero diario"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deleteitem")
        .setDescription("Quita un rol de la tienda")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Elige un rol")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deposit")
        .setDescription("Deposita dinero en el banco")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("fish").setDescription("Pesca algunos peces"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("hourly").setDescription("Recoge tu dinero por hora"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("hunt").setDescription("Caza algunos animales"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("monthly").setDescription("Recoge tu dinero mensual"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pay")
        .setDescription("Págale a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("present").setDescription("Recoge un regalo semanal"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("removemoney")
        .setDescription("Quítale dinero a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rob")
        .setDescription("Róbale a un usuario")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("store")
        .setDescription("Muestra la tienda de este servidor"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("weekly").setDescription("Recoge tu dinero semanal"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("withdraw")
        .setDescription("Retira tu dinero")
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Introduce una cantidad")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("work").setDescription("Ve a trabajar"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("yearly").setDescription("Recoge tu dinero anual"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Mira la clasificación de la economía")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("El tipo de clasificación que quieres")
            .setRequired(true)
            .addChoices(
              { name: "Dinero", value: "money" },
              { name: "Banco", value: "bank" },
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
