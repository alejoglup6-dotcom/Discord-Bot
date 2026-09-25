const Discord = require("discord.js");
const pop = require("popcat-wrapper");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const song = interaction.options.getString("song");

  const r = await pop.itunes(song).catch((e) => {
    return client.errNormal(
      {
        error: "¡No se encontró la canción!",
        type: "editreply",
      },
      interaction,
    );
  });

  client.embed(
    {
      title: `🎶・${r.name}`,
      thumbnail: r.thumbnail,
      url: r.url,
      fields: [
        {
          name: "💬┇Nombre",
          value: `${r.name}`,
          inline: true,
        },
        {
          name: "🎤┇Artista",
          value: `${r.artist}`,
          inline: true,
        },
        {
          name: "📁┇Álbum",
          value: `${r.album}`,
          inline: true,
        },
        {
          name: "🎼┇Duración",
          value: `${r.length}`,
          inline: true,
        },
        {
          name: "🏷️┇Género",
          value: `${r.genre}`,
          inline: true,
        },
        {
          name: "💵┇Precio",
          value: `${r.price}`,
          inline: true,
        },
        {
          name: "⏰┇Fecha de lanzamiento",
          value: `<t:${Math.round(new Date(r.release_date).getTime() / 1000)}>`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
