/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  if (!interaction.member.voice.channel)
    return client.errNormal(
      { error: `¡No estás en un canal de voz!`, type: "editreply" },
      interaction,
    );

  if (
    interaction.guild.members.me.voice.channel &&
    interaction.member.voice.channel.id !==
      interaction.guild.members.me.voice.channel.id
  )
    return client.errNormal(
      { error: `¡No estás en el mismo canal de voz!`, type: "editreply" },
      interaction,
    );

  client.soundboard(
    interaction.guild.id,
    interaction,
    "https://www.myinstants.com/media/sounds/musique-dascenseur-mp3cut.mp3",
  );

  client.succNormal(
    { text: "¡Soundboard iniciado! Reproduciendo **elevator**", type: "editreply" },
    interaction,
  );
};
