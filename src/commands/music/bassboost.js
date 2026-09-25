const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const player = client.player.players.get(interaction.guild.id);

  const levels = {
    0: 0.0,
    1: 0.5,
    2: 1.0,
    3: 2.0,
  };

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

  let level = interaction.options.getString("level");

  const bands = new Array(3)
    .fill(null)
    .map((_, i) => ({ band: i, gain: levels[level] }));

  await player.shoukaku.setFilters({ equalizer: bands });

  client.succNormal(
    {
      text: `Nivel de refuerzo de graves ajustado a **nivel ${level}**`,
      type: "editreply",
    },
    interaction,
  );
};
