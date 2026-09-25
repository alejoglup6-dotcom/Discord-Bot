const Discord = require("discord.js");
const pop = require("popcat-wrapper");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let name = interaction.options.getString("name");

  const r = await pop.github(name).catch(() => {
    return client.errNormal(
      {
        error: `No se encontró ninguna cuenta con el nombre de usuario: ${name}`,
        type: "editreply",
      },
      interaction,
    );
  });

  client.embed(
    {
      title: `🏷️・${r.name}`,
      thumbnail: r.avatar,
      url: r.url,
      fields: [
        {
          name: "💬┇Nombre",
          value: `${r.name}`,
          inline: true,
        },
        {
          name: "🧑‍💼┇Empresa",
          value: `${r.company}`,
          inline: true,
        },
        {
          name: "💬┇Biografía",
          value: `${r.bio}`,
          inline: true,
        },
        {
          name: "📁┇Repositorios públicos",
          value: `${r.public_repos}`,
          inline: true,
        },
        {
          name: "⏰┇Creado el",
          value: `<t:${Math.round(new Date(r.created_at).getTime() / 1000)}>`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
