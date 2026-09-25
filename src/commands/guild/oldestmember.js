const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const members = await interaction.guild.members.fetch();
  const getMember = members
    .filter((m) => !m.user.bot)
    .sort((a, b) => a.user.createdAt - b.user.createdAt);

  const member = Array.from(getMember.values());

  client.embed(
    {
      title: `👴・Miembro más antiguo`,
      desc: `Mira quién es el miembro más antiguo de **${interaction.guild.name}**`,
      fields: [
        {
          name: `👤┆Usuario`,
          value: `${member[0]} (${member[0].user.username}#${member[0].user.discriminator})`,
          inline: true,
        },
        {
          name: `⏰┆Creación de la cuenta`,
          value: `<t:${Math.round(member[0].user.createdTimestamp / 1000)}>`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
