const Discord = require("discord.js");

const Functions = require("../../database/models/functions");
const afk = require("../../database/models/afk");
const chatBotSchema = require("../../database/models/chatbot-channel");
const messagesSchema = require("../../database/models/messages");
const messageSchema = require("../../database/models/levelMessages");
const messageRewards = require("../../database/models/messageRewards");
const Schema = require("../../database/models/stickymessages");
const levelRewards = require("../../database/models/levelRewards");
const levelLogs = require("../../database/models/levelChannels");
const Commands = require("../../database/models/customCommand");
const CommandsSchema = require("../../database/models/customCommandAdvanced");
const fetch = require("node-fetch");

/**
 *
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 * @returns
 */
module.exports = async (client, message) => {
  const dmlog = new Discord.WebhookClient({
    id: client.webhooks.dmLogs.id,
    token: client.webhooks.dmLogs.token,
  });

  if (message.author.bot) return;

  if (message.channel.type === Discord.ChannelType.DM) {
    let embedLogs = new Discord.EmbedBuilder()
      .setTitle(`💬・¡Nuevo mensaje por MD!`)
      .setDescription(`¡Bot recibió un nuevo mensaje por MD!`)
      .addFields(
        {
          name: "👤┆Enviado por",
          value: `${message.author} (${message.author.tag})`,
          inline: true,
        },
        {
          name: `💬┆Mensaje`,
          value: `${message.content || "Ninguno"}`,
          inline: true,
        },
      )
      .setColor(client.config.colors.normal)
      .setTimestamp();

    if (message.attachments.size > 0)
      embedLogs.addFields({
        name: `📃┆Archivos adjuntos`,
        value: `${message.attachments.first()?.url}`,
        inline: false,
      });
    return dmlog.send({
      username: "Bot DM",
      embeds: [embedLogs],
    });
  }

  const guildId = message.guild.id;
  const userId = message.author.id;

  const guildSettings = await Functions.findOneAndUpdate(
    { Guild: guildId },
    { $setOnInsert: { Prefix: client.config.discord.prefix } },
    { new: true, upsert: true },
  )
    .lean()
    .exec();

  if (guildSettings && !guildSettings.Prefix) {
    Functions.updateOne(
      { Guild: guildId },
      { $set: { Prefix: client.config.discord.prefix } },
    ).catch(() => {});
  }

  const prefix = guildSettings?.Prefix || client.config.discord.prefix;

  // Levels
  if (guildSettings?.Levels === true) {
    const randomXP = Math.floor(Math.random() * 9) + 1;
    const hasLeveledUp = await client.addXP(userId, guildId, randomXP);

    if (hasLeveledUp) {
      const user = await client.fetchLevels(userId, guildId);

      const [levelData, messageData] = await Promise.all([
        levelLogs.findOne({ Guild: guildId }).lean().cache("60 seconds").exec(),
        messageSchema
          .findOne({ Guild: guildId })
          .lean()
          .exec(),
      ]);

      if (messageData) {
        var levelMessage = messageData.Message;
        levelMessage = levelMessage.replace(
          `{user:username}`,
          message.author.username,
        );
        levelMessage = levelMessage.replace(
          `{user:discriminator}`,
          message.author.discriminator,
        );
        levelMessage = levelMessage.replace(`{user:tag}`, message.author.tag);
        levelMessage = levelMessage.replace(`{user:mention}`, message.author);

        levelMessage = levelMessage.replace(`{user:level}`, user.level);
        levelMessage = levelMessage.replace(`{user:xp}`, user.xp);

        try {
          if (levelData) {
            await client.channels.cache
              .get(levelData.Channel)
              .send({ content: levelMessage })
              .catch(() => {});
          } else {
            await message.channel.send({ content: levelMessage });
          }
        } catch {
          await message.channel.send({ content: levelMessage });
        }
      } else {
        try {
          if (levelData) {
            await client.channels.cache
              .get(levelData.Channel)
              .send({
                content: `**GG** <@!${userId}>, ahora eres nivel **${user.level}**`,
              })
              .catch(() => {});
          } else {
            message.channel.send({
              content: `**GG** <@!${userId}>, ahora eres nivel **${user.level}**`,
            });
          }
        } catch {
          message.channel.send({
            content: `**GG** <@!${userId}>, ahora eres nivel **${user.level}**`,
          });
        }
      }

      levelRewards
        .findOne({ Guild: guildId, Level: user.level })
        .lean()
        .cache("60 seconds")
        .exec()
        .then(async (data) => {
          if (data) {
            message.member?.roles.add(data.Role).catch(() => {});
          }
        });
    }
  }

  // Message tracker system
  const messageCounter = await messagesSchema
    .findOne({ Guild: guildId, User: userId })
    .exec();

  const updatedMessageCounter = messageCounter
    ? await messagesSchema
        .findOneAndUpdate(
          { Guild: guildId, User: userId },
          { $inc: { Messages: 1 } },
          { new: true },
        )
        .exec()
    : await messagesSchema.create({
        Guild: guildId,
        User: userId,
        Messages: 1,
      });

  if (updatedMessageCounter) {
    messageRewards
      .findOne({ Guild: guildId, Messages: updatedMessageCounter.Messages })
      .lean()
      .cache("60 seconds")
      .exec()
      .then(async (reward) => {
        if (reward) {
          message.member?.roles.add(reward.Role).catch(() => {});
        }
      });
  }

  // AFK system
  afk.findOneAndDelete({ Guild: guildId, User: userId }).then(async (data) => {
    if (data) {
      client
        .simpleEmbed(
          {
            desc: `¡${message.author} ya no está AFK!`,
          },
          message.channel,
        )
        .then(async (m) => {
          setTimeout(() => {
            m?.delete().catch(() => {});
          }, 5000);
        });

      if (message.member.displayName.startsWith(`[AFK] `)) {
        let name = message.member.displayName.replace(`[AFK] `, ``);
        message.member.setNickname(name).catch(() => {});
      }
    }
  });

  if (
    !message.content.includes("@here") &&
    !message.content.includes("@everyone") &&
    message.mentions.users.size > 0
  ) {
    const mentionedUserIds = [...message.mentions.users.keys()];

    afk
      .find({ Guild: guildId, User: { $in: mentionedUserIds } })
      .lean()
      .exec()
      .then((afkUsers) => {
        if (!afkUsers?.length) return;

        for (const afkUser of afkUsers) {
          const user = message.mentions.users.get(afkUser.User);
          if (!user) continue;

          client.simpleEmbed(
            { desc: `¡${user} está AFK ahora mismo! **Razón:** ${afkUser.Message}` },
            message.channel,
          );
        }
      });
  }

  // Chat bot
  chatBotSchema
    .findOne({ Guild: message.guild.id })
    .lean()
    .cache("60 seconds")
    .exec()
    .then(async (data) => {
      if (!data) return;
      if (message.channel.id !== data.Channel) return;
      if (process.env.OPENAI) {
        fetch(`https://api.openai.com/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.OPENAI,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: message.content,
              },
            ],
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            const reply = data?.choices?.[0]?.message?.content;
            if (!reply) return;
            return message.reply({ content: reply.slice(0, 2000) });
          })
          .catch(() => {});
      }
    });

  // Sticky messages
  try {
    Schema.findOne({
      Guild: message.guild.id,
      Channel: message.channel.id,
    }).then(async (data) => {
      if (!data) return;

      const lastStickyMessage = await message.channel.messages
        .fetch(data.LastMessage)
        .catch(() => {});
      // Si el mensaje fijo anterior se borró a mano, se vuelve a publicar igualmente
      if (lastStickyMessage) await lastStickyMessage.delete().catch(() => {});

      const newMessage = await client.simpleEmbed(
        { desc: `${data.Content}` },
        message.channel,
      );

      if (!newMessage) return;
      data.LastMessage = newMessage.id;
      data.save();
    });
  } catch {}

  // Prefix
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefixRegex = new RegExp(
    `^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`,
  );

  if (!prefixRegex.test(message.content.toLowerCase())) return;
  const [, matchedPrefix] = message.content.toLowerCase().match(prefixRegex);

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (
    message.mentions.users.first() &&
    message.mentions.users.first().id == client.user.id &&
    command.length === 0
  ) {
    let row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setLabel("Invitar")
        .setURL(client.config.discord.botInvite)
        .setStyle(Discord.ButtonStyle.Link),

      new Discord.ButtonBuilder()
        .setLabel("Servidor de soporte")
        .setURL(client.config.discord.serverInvite)
        .setStyle(Discord.ButtonStyle.Link),
    );

    client
      .embed(
        {
          title: "Hola, soy Bot",
          desc: `Úsame con los comandos ${client.emotes.normal.slash} de Discord`,
          fields: [
            {
              name: "📨┆Invítame",
              value: `¡Invita a Bot a tu propio servidor! [Haz clic aquí](${client.config.discord.botInvite})`,
            },
            {
              name: "❓┇No veo ningún comando de barra",
              value:
                "Puede que el bot no tenga permisos para esto. Abre de nuevo el enlace de invitación y selecciona tu servidor. Así el bot recibirá los permisos correctos",
            },
            {
              name: "❓┆¿Necesitas soporte?",
              value: `¡Si tienes preguntas, puedes unirte a nuestro [servidor de soporte](${client.config.discord.serverInvite})!`,
            },
            {
              name: "🐞┆¿Encontraste un bug?",
              value: `¡Reporta los bugs con: \`/report bug\`!`,
            },
          ],
          components: [row],
        },
        message.channel,
      )
      .catch(() => {});
  }

  const cmd = await Commands.findOne({
    Guild: message.guild.id,
    Name: command,
  })
    .lean()
    .cache("60 seconds")
    .exec();
  if (cmd) {
    return message.channel.send({ content: cmd.Responce });
  }

  const cmdx = await CommandsSchema.findOne({
    Guild: message.guild.id,
    Name: command,
  })
    .lean()
    .cache("60 seconds")
    .exec();
  if (cmdx) {
    if (cmdx.Action == "Normal") {
      return message.channel.send({ content: cmdx.Responce });
    } else if (cmdx.Action == "Embed") {
      return client.simpleEmbed(
        {
          desc: `${cmdx.Responce}`,
        },
        message.channel,
      );
    } else if (cmdx.Action == "DM") {
      return message.author.send({ content: cmdx.Responce }).catch((e) => {
        client.errNormal(
          {
            error: "No puedo enviarte MD, ¡quizá los tienes desactivados!",
          },
          message.channel,
        );
      });
    }
  }
};
