const Discord = require("discord.js");

const Schema = require("../../database/models/stickymessages");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const channel = interaction.options.getChannel("channel");
  const content = interaction.options.getString("message");

  const embed = new Discord.EmbedBuilder()
    .setDescription(`${content}`)
    .setColor(client.config.colors.normal);
  channel.send({ embeds: [embed] }).then((msg) => {
    Schema.findOne({ Guild: interaction.guild.id, Channel: channel.id }).then(
      async (data) => {
        if (data) {
          data.Channel = channel.id;
          data.Content = content;
          data.LastMessage = msg.id;
          data.save();
        } else {
          new Schema({
            Guild: interaction.guild.id,
            Channel: channel.id,
            LastMessage: msg.id,
            Content: content,
          }).save();
        }
      },
    );

    client.succNormal(
      {
        text: "Mensaje fijo creado",
        fields: [
          {
            name: `💬┆Mensaje`,
            value: `${content}`,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  });
};
