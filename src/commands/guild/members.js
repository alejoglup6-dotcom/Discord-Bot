const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const members = await interaction.guild.members.fetch();

  client.embed(
    {
      title: `👤・Cantidad de miembros`,
      desc: `Mira el número total de miembros del servidor`,
      fields: [
        {
          name: `👤┆Miembros`,
          value: `${members.filter((member) => !member.user.bot).size} miembros`,
          inline: true,
        },
        {
          name: `🤖┆Bots`,
          value: `${members.filter((member) => member.user.bot).size} bots`,
          inline: true,
        },
        {
          name: `📘┆Total`,
          value: `${interaction.guild.memberCount} miembros`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
