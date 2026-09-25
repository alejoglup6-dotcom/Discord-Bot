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

  let amount = interaction.options.getNumber("amount");

  if (!amount)
    return client.simpleEmbed(
      {
        desc: `${client.emotes.normal.volume}┆El volumen actual es **${player.volume}%**`,
        type: "editreply",
      },
      interaction,
    );

  if (isNaN(amount) || amount === "Infinity")
    return client.errNormal(
      {
        text: `¡Introduce un número válido!`,
        type: "editreply",
      },
      interaction,
    );

  if (Math.round(parseInt(amount)) < 1 || Math.round(parseInt(amount)) > 1000)
    return client.errNormal(
      {
        text: "El volumen no puede superar el 1000%",
        type: "editreply",
      },
      interaction,
    );

  player.setVolume(parseInt(amount));

  client.succNormal(
    {
      text: `Volumen ajustado a **${amount}%**`,
      type: "editreply",
    },
    interaction,
  );
};
