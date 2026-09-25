const Discord = require("discord.js");
const lyricsFinder = require("lyrics-finder");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let search = "";

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

  if (!interaction.options.getString("song")) {
    search = player.queue.current.title;
  } else {
    search = interaction.options.getString("song");
  }

  let lyrics = "";

  try {
    lyrics = await lyricsFinder(search, "");
    if (!lyrics) lyrics = `No se encontró la letra de ${search} :x:`;
  } catch (error) {
    lyrics = `No se encontró la letra de ${search} :x:`;
  }

  client.embed(
    {
      title: `${client.emotes.normal.music}・Letra de ${search}`,
      desc: lyrics,
      type: "editreply",
    },
    interaction,
  );
};
