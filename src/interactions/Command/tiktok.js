const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tiktok")
    .setDescription("Gestiona los creadores de TikTok que vigila el bot")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Agrega un creador: se avisan sus videos que mencionen a la cuenta del servidor")
        .addStringOption((option) =>
          option
            .setName("user")
            .setDescription("Usuario de TikTok (con o sin @) o link de su perfil")
            .setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName("miembro")
            .setDescription("Su cuenta de Discord (opcional): sale en los avisos"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Quita un creador de la lista")
        .addStringOption((option) =>
          option
            .setName("user")
            .setDescription("Usuario de TikTok (con o sin @)")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Muestra los creadores de TikTok que se están vigilando"),
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
        flags: [Discord.PermissionsBitField.Flags.ManageGuild],
        perms: [Discord.PermissionsBitField.Flags.ManageGuild],
      },
      interaction,
    );

    if (perms == false) return;

    client.loadSubcommands(client, interaction, args);
  },
};
