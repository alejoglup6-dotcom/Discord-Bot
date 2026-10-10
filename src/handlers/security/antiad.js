const Discord = require("discord.js");

const Schema = require("../../database/models/functions");
const Schema2 = require("../../database/models/channelList");

// discord.gg/xxx, discord.com/invite/xxx, discordapp.com/invite/xxx (sin importar mayúsculas)
const INVITE_RE = /(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i;

module.exports = (client) => {
  client
    .on(Discord.Events.MessageCreate, async (message) => {
      if (
        message.channel.type === Discord.ChannelType.DM ||
        message.author.bot ||
        !message.member
      )
        return;
      Schema.findOne({ Guild: message.guild.id })
        .lean()
        .cache("60 seconds")
        .exec()
        .then(async (data) => {
        if (data) {
          if (data.AntiInvite == true) {
            const { content } = message;

            const code = INVITE_RE.test(content);
            if (code) {
              Schema2.findOne({ Guild: message.guild.id })
                .lean()
                .cache("60 seconds")
                .exec()
                .then(
                async (data2) => {
                  if (data2) {
                    if (
                      data2.Channels.includes(message.channel.id) ||
                      message.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    ) {
                      return;
                    }

                    message.delete().catch(() => {});

                    client.embed(
                      {
                        title: `${client.emotes.normal.error}・Moderación`,
                        desc: `¡No se permiten enlaces de Discord en este servidor!`,
                        color: client.config.colors.error,
                        content: `${message.author}`,
                      },
                      message.channel,
                    );
                  } else {
                    if (
                      message.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    )
                      return;
                    message.delete().catch(() => {});

                    client.embed(
                      {
                        title: `${client.emotes.normal.error}・Moderación`,
                        desc: `¡No se permiten enlaces de Discord en este servidor!`,
                        color: client.config.colors.error,
                        content: `${message.author}`,
                      },
                      message.channel,
                    );
                  }
                },
                );
            }
          }
          if (data.AntiLinks == true && !(data.AntiInvite == true && INVITE_RE.test(message.content))) {
            const { content } = message;

            if (
              content.includes("http://") ||
              content.includes("https://") ||
              content.includes("www.")
            ) {
              Schema2.findOne({ Guild: message.guild.id })
                .lean()
                .cache("60 seconds")
                .exec()
                .then(
                async (data2) => {
                  if (data2) {
                    if (
                      data2.Channels.includes(message.channel.id) ||
                      message.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    ) {
                      return;
                    }

                    message.delete().catch(() => {});

                    client.embed(
                      {
                        title: `${client.emotes.normal.error}・Moderación`,
                        desc: `¡No se permiten enlaces en este servidor!`,
                        color: client.config.colors.error,
                        content: `${message.author}`,
                      },
                      message.channel,
                    );
                  } else {
                    if (
                      message.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    )
                      return;
                    message.delete().catch(() => {});

                    client.embed(
                      {
                        title: `${client.emotes.normal.error}・Moderación`,
                        desc: `¡No se permiten enlaces en este servidor!`,
                        color: client.config.colors.error,
                        content: `${message.author}`,
                      },
                      message.channel,
                    );
                  }
                },
                );
            }
          }
        }
        });
    });

  client
    .on(Discord.Events.MessageUpdate, async (oldMessage, newMessage) => {
      if (
        oldMessage.content === newMessage.content ||
        newMessage.channel.type === Discord.ChannelType.DM ||
        !newMessage.member
      )
        return;

      Schema.findOne({ Guild: newMessage.guild.id })
        .lean()
        .cache("60 seconds")
        .exec()
        .then(async (data) => {
        if (data) {
          if (data.AntiInvite == true) {
            const { content } = newMessage;

            const code = INVITE_RE.test(content);
            if (code) {
              Schema2.findOne({ Guild: newMessage.guild.id })
                .lean()
                .cache("60 seconds")
                .exec()
                .then(
                async (data2) => {
                  if (data2) {
                    if (
                      data2.Channels.includes(newMessage.channel.id) ||
                      newMessage.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    ) {
                      return;
                    }

                    newMessage.delete().catch(() => {});
                    let error = new Discord.EmbedBuilder()
                      .setTitle(`${client.emotes.normal.error}・Moderación`)
                      .setAuthor(client.user.username, client.user.avatarURL())
                      .setDescription(
                        `¡No se permiten enlaces de Discord en este servidor!`,
                      )
                      .setColor(client.config.colors.error)
                      .setFooter({ text: client.config.discord.footer })
                      .setTimestamp();
                    var msg = newMessage.channel.send({
                      content: `${newMessage.author}`,
                      embeds: [error],
                    });
                    setTimeout(() => {
                      try {
                        msg.delete();
                      } catch (e) {
                        return;
                      }
                    }, 5000);
                  } else {
                    if (
                      newMessage.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    )
                      return;
                    newMessage.delete().catch(() => {});
                    let error = new Discord.EmbedBuilder()
                      .setTitle(`${client.emotes.normal.error}・Moderación`)
                      .setAuthor(client.user.username, client.user.avatarURL())
                      .setDescription(
                        `¡No se permiten enlaces de Discord en este servidor!`,
                      )
                      .setColor(client.config.colors.error)
                      .setFooter({ text: client.config.discord.footer })
                      .setTimestamp();
                    var msg = newMessage.channel.send({
                      content: `${newMessage.author}`,
                      embeds: [error],
                    });
                    setTimeout(() => {
                      try {
                        msg.delete();
                      } catch (e) {
                        return;
                      }
                    }, 5000);
                  }
                },
                );
            }
          }
          if (data.AntiLinks == true && !(data.AntiInvite == true && INVITE_RE.test(newMessage.content))) {
            const { guild, member, content } = newMessage;

            if (
              content.includes("http://") ||
              content.includes("https://") ||
              content.includes("www.")
            ) {
              Schema2.findOne({ Guild: newMessage.guild.id })
                .lean()
                .cache("60 seconds")
                .exec()
                .then(
                async (data2) => {
                  if (data2) {
                    if (
                      data2.Channels.includes(newMessage.channel.id) ||
                      newMessage.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    ) {
                      return;
                    }

                    newMessage.delete().catch(() => {});
                    var error = new Discord.EmbedBuilder()
                      .setTitle(`${client.emotes.normal.error}・Moderación`)
                      .setAuthor(client.user.username, client.user.avatarURL())
                      .setDescription(`¡No se permiten enlaces en este servidor!`)
                      .setColor(client.config.colors.error)
                      .setFooter({ text: client.config.discord.footer })
                      .setTimestamp();
                    var msg = newMessage.channel.send({
                      content: `${newMessage.author}`,
                      embeds: [error],
                    });
                    setTimeout(() => {
                      try {
                        msg.delete();
                      } catch (e) {
                        return;
                      }
                    }, 5000);
                  } else {
                    if (
                      newMessage.member.permissions.has(
                        Discord.PermissionsBitField.Flags.ManageMessages,
                      )
                    )
                      return;
                    newMessage.delete().catch(() => {});
                    var error = new Discord.EmbedBuilder()
                      .setTitle(`${client.emotes.normal.error}・Moderación`)
                      .setAuthor(client.user.username, client.user.avatarURL())
                      .setDescription(`¡No se permiten enlaces en este servidor!`)
                      .setColor(client.config.colors.error)
                      .setFooter({ text: client.config.discord.footer })
                      .setTimestamp();
                    var msg = newMessage.channel.send({
                      content: `${newMessage.author}`,
                      embeds: [error],
                    });
                    setTimeout(() => {
                      try {
                        msg.delete();
                      } catch (e) {
                        return;
                      }
                    }, 5000);
                  }
                },
                );
            }
          }
        }
        });
    })
    ;
};
