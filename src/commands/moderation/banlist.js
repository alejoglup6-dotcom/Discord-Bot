const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.BanMembers],
      perms: [Discord.PermissionsBitField.Flags.BanMembers],
    },
    interaction,
  );

  if (perms == false) return;

  interaction.guild.bans
    .fetch()
    .then(async (banned) => {
      let list = banned.map(
        (banUser) =>
          `${banUser.user.tag}・**Razón:** ${banUser.reason || "Sin razón"}`,
      );

      if (list.length == 0)
        return client.errNormal(
          {
            error: `Este servidor no tiene baneos`,
            type: "editreply",
          },
          interaction,
        );

      await client.createLeaderboard(
        `🔧・Lista de baneos - ${interaction.guild.name}`,
        list,
        interaction,
      );
    })
    .catch((error) => {
      console.log(error);
    });
};
