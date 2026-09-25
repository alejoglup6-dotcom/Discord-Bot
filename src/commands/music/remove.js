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

  let number = interaction.options.getNumber("number");

  if (number < 1 || number > player.queue.size)
    return client.errNormal(
      {
        error: `La cola no tiene tantas canciones`,
        type: "editreply",
      },
      interaction,
    );

  const targetSong = player.queue[parseInt(number - 1)];
  player.queue.remove(parseInt(number) - 1);

  client.succNormal(
    {
      text: `Se quitó **${targetSong.title}** de la cola`,
      type: "editreply",
    },
    interaction,
  );
};
