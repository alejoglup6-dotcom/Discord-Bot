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

  if (!player || !player.queue.current)
    return client.errNormal(
      {
        error: "No se está reproduciendo ninguna canción en este servidor",
        type: "editreply",
      },
      interaction,
    );

  let count = 0;
  let status;

  if (player.queue.length == 0) {
    status = "No hay más música en la cola";
  } else {
    status = player.queue
      .map((track) => {
        count += 1;
        return `**[#${count}]**┆${track.title.length >= 45 ? `${track.title.slice(0, 45)}...` : track.title} (Pedida por <@!${track.requester.id}>)`;
      })
      .join("\n");
  }

  let thumbnail;
  if (player.queue.current.thumbnail)
    thumbnail = player.queue.current.thumbnail;
  else thumbnail = interaction.guild.iconURL({ size: 1024 });

  client.embed(
    {
      title: `${client.emotes.normal.music}・Cola de canciones - ${interaction.guild.name}`,
      desc: status,
      thumbnail: thumbnail,
      fields: [
        {
          name: `${client.emotes.normal.music} Canción actual:`,
          value: `${player.queue.current.title} (Pedida por <@!${player.queue.current.requester.id}>)`,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
