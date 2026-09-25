const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.KickMembers],
      perms: [Discord.PermissionsBitField.Flags.KickMembers],
    },
    interaction,
  );

  if (perms == false) return;

  const member = await interaction.guild.members.fetch(
    interaction.options.getUser("user").id,
  );
  const reason = interaction.options.getString("reason") || "No indicada";

  if (
    member.permissions.has(Discord.PermissionsBitField.Flags.KickMembers) ||
    member.permissions.has(Discord.PermissionsBitField.Flags.KickMembers)
  )
    return client.errNormal(
      {
        error: "No puedes expulsar a un moderador",
        type: "editreply",
      },
      interaction,
    );

  client
    .embed(
      {
        title: `🔨・Expulsión`,
        desc: `Te expulsaron de **${interaction.guild.name}**`,
        fields: [
          {
            name: "👤┆Expulsado por",
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
      member.kick(reason);
      client.succNormal(
        {
          text: "¡El usuario indicado fue expulsado correctamente y recibió una notificación!",
          fields: [
            {
              name: "👤┆Usuario expulsado",
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
      member.kick(reason);
      client.succNormal(
        {
          text: "El usuario indicado fue expulsado correctamente, ¡pero no recibió ninguna notificación!",
          type: "editreply",
        },
        interaction,
      );
    });
};
