const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const catalog = require("../../assets/data/fortuna");

const categoryChoices = Object.entries(catalog.CATEGORIES).map(([id, c]) => ({ name: `${c.emoji} ${c.name}`, value: id }));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fortune")
    .setDescription("Fortuna: oficios, propiedades y asaltos (minijuego, no toca el juego)")
    .addSubcommand((subcommand) =>
      subcommand.setName("help").setDescription("Información sobre los comandos de esta categoría"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("overview")
        .setDescription("Tu fortuna: dinero, oficio, propiedades y valor total")
        .addUserOption((option) => option.setName("user").setDescription("Ver la fortuna de otro miembro").setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("top").setDescription("Ranking de las mayores fortunas y premios semanales"),
    )
    .addSubcommand((subcommand) => subcommand.setName("jobs").setDescription("Oficios disponibles y lo que pagan"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("contract")
        .setDescription("Firma el contrato de un oficio")
        .addStringOption((option) =>
          option
            .setName("job")
            .setDescription("Oficio")
            .setRequired(true)
            .addChoices(...catalog.JOBS.map((j) => ({ name: `${j.emoji} ${j.name}`, value: j.id }))),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("resign").setDescription("Renuncia a tu oficio"))
    .addSubcommand((subcommand) => subcommand.setName("work").setDescription("Haz un turno de tu oficio"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("store")
        .setDescription("Catálogo de autos, casas, negocios, empresas y armas")
        .addStringOption((option) =>
          option.setName("category").setDescription("Categoría").setRequired(true).addChoices(...categoryChoices),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buy")
        .setDescription("Compra una propiedad o un arma")
        .addStringOption((option) =>
          option.setName("category").setDescription("Categoría").setRequired(true).addChoices(...categoryChoices),
        )
        .addStringOption((option) => option.setName("item").setDescription("Nombre del artículo (mira /fortuna tienda)").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sell")
        .setDescription(`Vende una propiedad o un arma (recuperas el ${Math.round(catalog.SELL_RATE * 100)}%)`)
        .addStringOption((option) =>
          option.setName("category").setDescription("Categoría").setRequired(true).addChoices(...categoryChoices),
        )
        .addStringOption((option) => option.setName("item").setDescription("Nombre del artículo").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("collect").setDescription("Cobra lo que generaron tus casas, negocios y empresas"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("heist").setDescription("Asalta un local (necesitas un arma; si fallas pagas una multa)"),
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
