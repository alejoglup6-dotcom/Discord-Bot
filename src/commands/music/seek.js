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

  if (player.queue.current.isStream)
    return client.errNormal(
      {
        error: "No se puede adelantar una transmisión en vivo",
        type: "editreply",
      },
      interaction,
    );

  let number = interaction.options.getNumber("time");
  player.seek(Number(number) * 1000);

  client.succNormal(
    {
      text: `Canción adelantada a: ${format(Number(number) * 1000)}`,
      fields: [
        {
          name: `${client.emotes.normal.music}┆Progreso`,
          value: progressBar(player.queue.current, Number(number) * 1000),
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};

function format(millis) {
  try {
    var h = Math.floor(millis / 3600000),
      m = Math.floor(millis / 60000),
      s = ((millis % 60000) / 1000).toFixed(0);
    if (h < 1) return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    else
      return (
        (h < 10 ? "0" : "") +
        h +
        ":" +
        (m < 10 ? "0" : "") +
        m +
        ":" +
        (s < 10 ? "0" : "") +
        s
      );
  } catch (e) {
    console.log(String(e.stack).bgRed);
  }
}
