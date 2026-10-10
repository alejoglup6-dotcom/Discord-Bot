const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serversetup")
    .setDescription("Comandos para configurar el servidor de SampCity")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription(
          "⚠️ Borra TODO el servidor (canales y roles) y crea la plantilla de SampCity",
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

    const botPerms = await client.checkBotPerms(
      {
        flags: [
          Discord.PermissionsBitField.Flags.Administrator,
        ],
        perms: [Discord.PermissionsBitField.Flags.Administrator],
      },
      interaction,
    );

    if (botPerms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
