const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

const model = require("../../database/models/badge");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("developers")
    .setDescription("Comandos para los desarrolladores de Bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("help")
        .setDescription(
          "Información sobre los comandos de la categoría de desarrolladores",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("eval")
        .setDescription("Ejecuta un fragmento de código y mira el resultado")
        .addStringOption((option) =>
          option.setName("code").setDescription("Tu código").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("badge")
        .setDescription("Gestiona las insignias del bot")
        .addBooleanOption((option) =>
          option
            .setName("new")
            .setDescription("Elige verdadero o falso")
            .setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("badge")
            .setDescription("Elige la insignia")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ban")
        .setDescription("Gestiona los baneos del bot")
        .addBooleanOption((option) =>
          option
            .setName("new")
            .setDescription("Elige verdadero o falso")
            .setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("credits")
        .setDescription("Gestiona los créditos del bot")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("El tipo de créditos")
            .setRequired(true)
            .addChoices(
              { name: "Añadir", value: "add" },
              { name: "Quitar", value: "remove" },
            ),
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Elige un usuario")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Cantidad de créditos")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("args")
        .setDescription("Publica mensajes predefinidos")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Elige un mensaje")
            .setRequired(true)
            .addChoices(
              { name: "Información", value: "information" },
              { name: "Reglas", value: "rules" },
              { name: "Solicitudes", value: "applications" },
              { name: "Beneficios para boosters", value: "boosterperks" },
              { name: "Enlaces", value: "links" },
              { name: "Recompensas", value: "rewards" },
              { name: "Nuestros bots", value: "ourbots" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("servers")
        .setDescription("Mira todos los servidores de este shard"),
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    model.findOne({ User: interaction.user.id }).then(async (data) => {
      if (data && data.FLAGS.includes("DEVELOPER")) {
        await interaction.deferReply({ withResponse: true });
        client.loadSubcommands(client, interaction, args);
      } else {
        return client.errNormal(
          {
            error: "Solo los desarrolladores de Bot pueden hacer esto",
            type: "ephemeral",
          },
          interaction,
        );
      }
    });
  },
};
