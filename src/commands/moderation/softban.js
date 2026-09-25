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

  const member = await interaction.guild.members.fetch(
    interaction.options.getUser("user").id,
  );
  const reason = interaction.options.getString("reason") || "No indicada";

  if (
    member.permissions.has(Discord.PermissionsBitField.Flags.BanMembers) ||
    member.permissions.has(Discord.PermissionsBitField.Flags.BanMembers)
  )
    return client.errNormal(
      {
        error: "No puedes banear a un moderador",
        type: "editreply",
      },
      interaction,
    );

  client
    .embed(
      {
        title: `🔨・Baneo`,
        desc: `Te banearon de **${interaction.guild.name}**`,
        fields: [
          {
            name: "👤┆Baneado por",
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: "💬┆Razón",
            value: reason,
            inline: true,
          },
        ],
      },
      member,
    )
    .then(function () {
      member.ban({ days: 7, reason: reason });
      client.succNormal(
        {
          text: "¡El usuario indicado fue baneado correctamente y recibió una notificación!",
          fields: [
            {
              name: "👤┆Usuario baneado",
              value: member.user.tag,
              inline: true,
            },
            {
              name: "💬┆Razón",
              value: reason,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    })
    .catch(function () {
      member.ban({ days: 7, reason: reason });
      client.succNormal(
        {
          text: "El usuario indicado fue baneado correctamente, ¡pero no recibió ninguna notificación!",
          type: "editreply",
        },
        interaction,
      );
    });

  setTimeout(() => {
    interaction.guild.members.unban(member.id);
  }, 2000);
};
