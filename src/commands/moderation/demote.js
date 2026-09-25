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

  member.roles
    .remove(member.roles.highest.id)
    .then((r) => {
      client
        .embed(
          {
            title: `🔨・Degradar`,
            desc: `Te degradaron en **${interaction.guild.name}**`,
            fields: [
              {
                name: "👤┆Moderador",
                value: interaction.user.tag,
                inline: true,
              },
            ],
          },
          member,
        )
        .catch(() => {});

      client.succNormal(
        {
          text: `Usuario degradado correctamente`,
          fields: [
            {
              name: "👤┆Usuario",
              value: `${member}`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    })
    .catch((e) => {
      client.errNormal(
        {
          error: "No puedo degradar al usuario",
          type: "editreply",
        },
        interaction,
      );
    });
};
