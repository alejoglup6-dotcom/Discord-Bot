const Discord = require("discord.js");

const forHumans = require("../../assets/utils/forhumans.js");

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

  if (!player || !player.queue.current)
    return client.errNormal(
      {
        error: "No se está reproduciendo ninguna canción en este servidor",
        type: "editreply",
      },
      interaction,
    );


  client.embed(
    {
      title: `${client.emotes.normal.music}・${player.queue.current.title}`,
      url: player.queue.current.uri,
      thumbnail: player.queue.current?.thumbnail
        ? player.queue.current?.thumbnail
        : "",
      fields: [
        {
          name: `👤┆Pedida por`,
          value: `${player.queue.current.requester}`,
          inline: true,
        },
        {
          name: `${client.emotes.normal.clock}┆Duración`,
          value: `<t:${(Date.now() / 1000 + player.queue.current.length / 1000 - nowTime / 1000).toFixed(0)}:f>`,
          inline: true,
        },
        {
          name: `${client.emotes.normal.volume}┆Volumen`,
          value: `${player.volume}%`,
          inline: true,
        },
        {
          name: `${client.emotes.normal.music}┆Progreso`,
          value:
            `${new Date(player.position).toISOString().slice(11, 19)} ┃ ` +
            bar +
            ` ┃ ${new Date(player.queue.current.length).toISOString().slice(11, 19)}`,
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};

async function createProgressBar(
  total,
  current,
  size = 10,
  line = "▬",
  slider = "🔘",
) {
  if (current > total) {
    const bar = line.repeat(size + 2);
    const percentage = (current / total) * 100;
    return [bar, percentage];
  } else {
    const percentage = current / total;
    const progress = Math.round(size * percentage);

    if (progress > 1 && progress < 10) {
      const emptyProgress = size - progress;
      const progressText = line.repeat(progress).replace(/.$/, slider);
      const emptyProgressText = line.repeat(emptyProgress);
      const bar = progressText + emptyProgressText;
      return [bar];
    } else if (progress < 1 || progress == 1) {
      const emptyProgressText = line.repeat(9);
      const bar = "🔘" + emptyProgressText;
      return [bar];
    } else if (progress > 10 || progress == 10) {
      const emptyProgressText = line.repeat(9);
      const bar = emptyProgressText + "🔘";
      return [bar];
    }
  }
}
