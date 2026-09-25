const Discord = require("discord.js");
const pop = require("popcat-wrapper");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const name = interaction.options.getString("name");

  const r = await pop.npm(name).catch((e) => {
    return client.errNormal(
      {
        error: "¡No se encontró el paquete!",
        type: "editreply",
      },
      interaction,
    );
  });

  client.embed(
    {
      title: `📁・${r.name}`,
      fields: [
        {
          name: "💬┇Nombre",
          value: `${r.name}`,
          inline: true,
        },
        {
          name: "🏷️┇Versión",
          value: `${r.version}`,
          inline: true,
        },
        {
          name: "📃┇Descripción",
          value: `${r.description}`,
          inline: true,
        },
        {
          name: "⌨️┇Palabras clave",
          value: `${r.keywords}`,
          inline: true,
        },
        {
          name: "💻┇Autor",
          value: `${r.author}`,
          inline: true,
        },
        {
          name: "📁┇Descargas",
          value: `${r.downloads_this_year}`,
          inline: true,
        },
        {
          name: "⏰┇Última publicación",
          value: `<t:${Math.round(new Date(r.last_published).getTime() / 1000)}>`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
