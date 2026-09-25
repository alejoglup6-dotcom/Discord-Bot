const Discord = require("discord.js");

const Schema = require("../../database/models/warnings");
const Case = require("../../database/models/warnCase");
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

  var member = interaction.options.getUser("user");
  var reason = interaction.options.getString("reason");
  var caseNumber;
  await Case.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (!data) {
      new Case({
        Guild: interaction.guild.id,
        Case: 1,
      }).save();
      caseNumber = 1;
    } else {
      data.Case += 1;
      data.save();
      caseNumber = data.Case;
    }
  });

  Schema.findOne({ Guild: interaction.guild.id, User: member.id }).then(
    async (data) => {
      if (data) {
        data.Warnings.push({
          Moderator: interaction.user.id,
          Reason: reason,
          Date: Date.now(),
          Case: caseNumber,
        });
        data.save();
      } else {
        new Schema({
          Guild: interaction.guild.id,
          User: member.id,
          Warnings: [
            {
              Moderator: interaction.user.id,
              Reason: reason,
              Date: Date.now(),
              Case: caseNumber,
            },
          ],
        }).save();
      }
    },
  );

  client
    .embed(
      {
        title: `🔨・Advertencia`,
        desc: `Recibiste una advertencia en **${interaction.guild.name}**`,
        fields: [
          {
            name: "👤┆Moderador",
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: "📄┆Razón",
            value: reason,
            inline: true,
          },
        ],
      },
      member,
    )
    .catch(() => {});

  client.emit("warnAdd", member, interaction.user, reason);
  client.succNormal(
    {
      text: `¡El usuario recibió una advertencia!`,
      fields: [
        {
          name: "👤┆Usuario",
          value: `${member}`,
          inline: true,
        },
        {
          name: "👤┆Moderador",
          value: `${interaction.user}`,
          inline: true,
        },
        {
          name: "📄┆Razón",
          value: reason,
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
