const Discord = require("discord.js");
const Voice = require("@discordjs/voice");

module.exports = (client) => {
  client.on(Discord.Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId == "Bot-musicpause") {
        interaction.deferUpdate();

        const player = client.player.players.get(interaction.guild.id);
        if (!player) return;

        player.pause(true);

        const embedData = interaction.message.embeds[0];

        let row = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.previous)
            .setCustomId("Bot-musicprev")
            .setStyle(Discord.ButtonStyle.Secondary),

          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.play)
            .setCustomId("Bot-musicstart")
            .setStyle(Discord.ButtonStyle.Secondary),

          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.stop)
            .setCustomId("Bot-musicstop")
            .setStyle(Discord.ButtonStyle.Secondary),

          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.next)
            .setCustomId("Bot-musicnext")
            .setStyle(Discord.ButtonStyle.Secondary),
        );

        client.embed(
          {
            title: embedData.title,
            url: embedData.url,
            desc: `La música está en pausa`,
            thumbnail: embedData.thumbnail?.url,
            fields: embedData.fields,
            components: [row],
            color: client.config.colors.error,
            type: "edit",
          },
          interaction.message,
        );
      }

      if (interaction.customId == "Bot-musicstart") {
        interaction.deferUpdate();

        const player = client.player.players.get(interaction.guild.id);
        if (!player) return;

        player.pause(false);

        const embedData = interaction.message.embeds[0];

        let row = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.previous)
            .setCustomId("Bot-musicprev")
            .setStyle(Discord.ButtonStyle.Secondary),

          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.pause)
            .setCustomId("Bot-musicpause")
            .setStyle(Discord.ButtonStyle.Secondary),

          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.stop)
            .setCustomId("Bot-musicstop")
            .setStyle(Discord.ButtonStyle.Secondary),

          new Discord.ButtonBuilder()
            .setEmoji(client.emotes.music.next)
            .setCustomId("Bot-musicnext")
            .setStyle(Discord.ButtonStyle.Secondary),
        );

        client.embed(
          {
            title: embedData.title,
            url: embedData.url,
            desc: `La música se reanudó`,
            thumbnail: embedData.thumbnail?.url,
            fields: embedData.fields,
            components: [row],
            type: "edit",
          },
          interaction.message,
        );
      }

      if (interaction.customId == "Bot-musicstop") {
        interaction.deferUpdate();

        const player = client.player.players.get(interaction.guild.id);
        if (!player) return;

        player.data.set("leaving", true);
        player.destroy().catch(() => {});

        client.embed(
          {
            desc: `La música se detuvo`,
            color: client.config.colors.error,
            components: [],
            type: "edit",
          },
          interaction.message,
        );
      }

      if (interaction.customId == "Bot-musicnext") {
        interaction.deferUpdate();

        const player = client.player.players.get(interaction.guild.id);
        if (!player) return;

        player.skip();

        client.embed(
          {
            desc: `¡Canción saltada!`,
            components: [],
            type: "edit",
          },
          interaction.message,
        );
      }

      if (interaction.customId == "Bot-musicprev") {
        interaction.deferUpdate();

        const player = client.player.players.get(interaction.guild.id);
        const track = player?.getPrevious(true);
        if (!track) return;

        client.embed(
          {
            desc: `Volviendo a **${track.title}**`,
            components: [],
            type: "edit",
          },
          interaction.message,
        );

        player.play(track);
      }
    }
  });
};
