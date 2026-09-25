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

  if (perms == false) return;

  var member = interaction.options.getUser("user");
  var Case = interaction.options.getInteger("case");

  Schema.findOne({ Guild: interaction.guild.id, User: member.id }).then(
    async (data) => {
      if (data) {
        var warn = data.Warnings.find((x) => x.Case == Case);
        if (!warn) {
          client.errNormal(
            {
              error: "¡Este usuario no tiene ninguna advertencia con este número de caso!",
              type: "editreply",
            },
            interaction,
          );
          return;
        }
        data.Warnings.splice(data.Warnings.indexOf(warn), 1);
        data.save();
      } else {
        client.errNormal(
          {
            error: "¡El usuario no tiene advertencias!",
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );

  client
    .embed(
      {
        title: `🔨・Advertencia retirada`,
        desc: `Te retiraron una advertencia en **${interaction.guild.name}**`,
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

  client.emit("warnRemove", member, interaction.user);
  client.succNormal(
    {
      text: `La advertencia del usuario se eliminó correctamente`,
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
};
