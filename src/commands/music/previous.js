const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const player = client.player.players.get(interaction.guild.id);

  const channel = interaction.member.voice.channel;
  if (!channel)
    return client.errNormal(
      {
        error: `¡No estás en un canal de voz!`,
        type: "editreply",
      },
      interaction,
    );

  if (player && channel.id !== player?.voiceId)
    return client.errNormal(
      {
        error: `¡No estás en el mismo canal de voz!`,
        type: "editreply",
      },
      interaction,
    );

  const track = player?.getPrevious();
  if (!player || !track)
    return client.errNormal(
      {
        error: "No se ha reproducido ninguna canción antes",
        type: "editreply",
      },
      interaction,
    );

  let row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setEmoji("⏮️")
      .setCustomId("Bot-musicprev")
      .setStyle(Discord.ButtonStyle.Primary),

    new Discord.ButtonBuilder()
      .setEmoji("⏸️")
      .setCustomId("Bot-musicpause")
      .setStyle(Discord.ButtonStyle.Primary),

    new Discord.ButtonBuilder()
      .setEmoji("⏹️")
      .setCustomId("Bot-musicstop")
      .setStyle(Discord.ButtonStyle.Primary),

    new Discord.ButtonBuilder()
      .setEmoji("⏭️")
      .setCustomId("Bot-musicnext")
      .setStyle(Discord.ButtonStyle.Primary),
  );

  client.embed(
    {
      title: `${client.emotes.normal.music}・${track.title}`,
      url: track.uri,
      desc: `¡La música empezó en <#${player.voiceId}>!`,
      thumbnail: track.thumbnail,
      fields: [
        {
          name: `👤┆Pedida por`,
          value: `${track.requester}`,
          inline: true,
        },
        {
          name: `${client.emotes.normal.clock}┆Termina a las`,
          value: `<t:${(Date.now() / 1000 + track.duration / 1000).toFixed(0)}:f>`,
          inline: true,
        },
        {
          name: `🎬┆Autor`,
          value: `${track.author}`,
          inline: true,
        },
      ],
      components: [row],
      type: "editreply",
    },
    interaction,
  );

  player.play(track);
};
