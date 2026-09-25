const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  client.embed(
    {
      title: `📻・Información de la radio`,
      desc: `Toda la información sobre la radio en este servidor`,
      fields: [
        {
          name: "👤┆Oyentes del canal",
          value: `${interaction.member.voice.channel.members.size} oyentes`,
          inline: true,
        },
        {
          name: "📺┆Canal conectado",
          value: `${interaction.member.voice.channel} (${interaction.member.voice.channel.name})`,
          inline: true,
        },
        {
          name: "🎶┆Emisora",
          value: `[Radio 538](https://www.538.nl/)`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
