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
      { text: `¡El canal no existe!`, type: "editreply" },
      interaction,
    );

  client.radioStart(channel);

  Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (data) {
      data.Channel = channel.id;
      data.save();
    } else {
      new Schema({
        Guild: interaction.guild.id,
        Channel: channel.id,
      }).save();
    }
  });

  client.embed(
    {
      title: `📻・Radio iniciada`,
      desc: `La radio se inició correctamente \nPara que el bot salga usa: \`rleave\``,
      fields: [
        {
          name: "👤┆Iniciada por",
          value: `${interaction.user} (${interaction.user.tag})`,
          inline: true,
        },
        {
          name: "📺┆Canal",
          value: `${channel} (${channel.name})`,
          inline: true,
        },
        {
          name: "🎶┆Emisora",
          value: `[Radio 538](https://www.538.nl/)`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );

  let embed = new Discord.EmbedBuilder()
    .setTitle(`📻・Radio iniciada`)
    .setDescription(`_______________ \n\nLa radio se inició correctamente`)
    .addFields(
      {
        name: "👤┆Iniciada por",
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
