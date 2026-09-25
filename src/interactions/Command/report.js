const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Reporta un bug o un usuario a los desarrolladores")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("El tipo de reporte")
        .setRequired(true)
        .addChoices(
          { name: "Bug", value: "bug" },
          { name: "Usuario", value: "user" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Descripción de tu reporte")
        .setRequired(true),
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    const webhookClient = new Discord.WebhookClient({
      id: client.webhooks.bugReportLogs.id,
      token: client.webhooks.bugReportLogs.token,
    });

    const type = interaction.options.getString("type");
    const desc = interaction.options.getString("description");

    if (type == "bug") {
      const embed = new Discord.EmbedBuilder()
        .setTitle(`📣・¡Nuevo reporte de bug!`)
        .addFields(
          { name: "Categoría del reporte", value: "Bug", inline: true },
          {
            name: "Enviado por",
            value: `${interaction.user.tag}`,
            inline: true,
          },
        )
        .setDescription(`${desc}`)
        .setColor(client.config.colors.normal);
      webhookClient.send({
        username: "Bot Reports",
        embeds: [embed],
      });

      client.succNormal(
        {
          text: `¡Bug enviado correctamente a los desarrolladores!`,
          type: "ephemeraledit",
        },
        interaction,
      );
    } else if (type == "user") {
      const embed = new Discord.EmbedBuilder()
        .setTitle(`📣・¡Nuevo reporte de usuario!`)
        .addFields(
          { name: "Categoría del reporte", value: "Usuario", inline: true },
          {
            name: "Enviado por",
            value: `${interaction.user.tag}`,
            inline: true,
          },
        )
        .setDescription(`${desc}`)
        .setColor(client.config.colors.normal);
      webhookClient.send({
        username: "Bot Reports",
        embeds: [embed],
      });

      client.succNormal(
        {
          text: `¡Reporte de usuario enviado correctamente a los desarrolladores!`,
          type: "ephemeraledit",
        },
        interaction,
      );
    }
  },
};
