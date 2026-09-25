const Discord = require("discord.js");

const progressBar = require("../../assets/utils/progressBar.js");

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
          value: player.queue.current.isStream
            ? "🔴 EN VIVO"
            : `<t:${((Date.now() + player.queue.current.length - player.position) / 1000).toFixed(0)}:f>`,
          inline: true,
        },
        {
          name: `${client.emotes.normal.volume}┆Volumen`,
          value: `${player.volume}%`,
          inline: true,
        },
        {
          name: `${client.emotes.normal.music}┆Progreso`,
          value: progressBar(player.queue.current, player.position),
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};

