const Discord = require("discord.js");

const Schema = require("../../database/models/stats");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var channelName = await client.getTemplate(interaction.guild);
  channelName = channelName.replace(`{emoji}`, "👔");
  channelName = channelName.replace(
    `{name}`,
    `Roles: ${interaction.guild.roles.cache.size.toLocaleString()}`,
  );

  await interaction.guild.channels
    .create({
      name: channelName,
      type: Discord.ChannelType.GuildVoice,
      permissionOverwrites: [
        {
          deny: [Discord.PermissionsBitField.Flags.Connect],
          id: interaction.guild.id,
        },
      ],
    })
    .then(async (channel) => {
      Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
        if (data) {
          data.Roles = channel.id;
          data.save();
        } else {
          new Schema({
            Guild: interaction.guild.id,
            Roles: channel.id,
          }).save();
        }
      });

      client.succNormal(
        {
          text: `¡Se creó el contador de roles!`,
          fields: [
            {
              name: `📘┆Canal`,
              value: `${channel}`,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    });
};
