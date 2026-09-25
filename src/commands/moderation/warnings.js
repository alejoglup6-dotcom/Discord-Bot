const Discord = require("discord.js");

const Schema = require("../../database/models/warnings");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) {
    client.errNormal(
      {
        error: "¡No tienes los permisos necesarios para usar este comando!",
        type: "editreply",
      },
      interaction,
    );
    return;
  }

  const member = interaction.options.getUser("user");

  Schema.findOne({ Guild: interaction.guild.id, User: member.id }).then(
    async (data) => {
      if (data) {
        var fields = [];
        data.Warnings.forEach((element) => {
          fields.push({
            name: "Advertencia **" + element.Case + "**",
            value:
              "Razón: " +
              element.Reason +
              "\nModerador <@!" +
              element.Moderator +
              ">",
            inline: true,
          });
        });
        client.embed(
          {
            title: `${client.emotes.normal.error}・Advertencias`,
            desc: `Las advertencias de **${member.tag}**`,
            fields: [
              {
                name: "Total",
                value: `${data.Warnings.length}`,
              },
              ...fields,
            ],
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.embed(
          {
            title: `${client.emotes.normal.error}・Advertencias`,
            desc: `¡El usuario ${member.user.tag} no tiene advertencias!`,
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
