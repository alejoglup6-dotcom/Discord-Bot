const Discord = require("discord.js");
const Schema = require("../../database/models/music");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const webhookClientLogs = new Discord.WebhookClient({
    id: client.webhooks.voiceLogs.id,
    token: client.webhooks.voiceLogs.token,
  });

  let channel = interaction.member.voice
    ? interaction.member.voice.channel
    : null;
  if (!channel)
    return client.errNormal(
      { error: `¡El canal no existe!`, type: "editreply" },
      interaction,
    );

  client.radioStop(channel);

  var remove = await Schema.deleteOne({ Guild: interaction.guild.id });

  client.embed(
    {
      title: `📻・Radio detenida`,
      desc: `La radio se detuvo correctamente \nPara que el bot entre usa: \`rplay\``,
      fields: [
        {
          name: "👤┆Detenida por",
          value: `${interaction.user} (${interaction.user.tag})`,
          inline: true,
        },
        {
          name: "📺┆Canal",
          value: `${channel} (${channel.name})`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );

  let embed = new Discord.EmbedBuilder()
    .setTitle(`📻・Radio detenida`)
    .setDescription(`_______________ \n\nLa radio se detuvo correctamente`)
    .addFields(
      {
        name: "👤┆Detenida por",
        value: `${interaction.user} (${interaction.user.tag})`,
        inline: true,
      },
      {
        name: "📺┆Canal",
        value: `${channel} (${channel.name})`,
        inline: true,
      },
      {
        name: "⚙️┆Servidor",
        value: `${interaction.guild.name} (${interaction.guild.id})`,
        inline: true,
      },
    )
    .setColor(client.config.colors.normal)
    .setTimestamp();
  webhookClientLogs.send({
    username: "Bot Logs",
    embeds: [embed],
  });
};
