const Discord = require("discord.js");

const Schema = require("../../database/models/invites");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let user = interaction.options.getUser("user");
  let amount = interaction.options.getNumber("amount");

  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  const data = await Schema.findOne({
    Guild: interaction.guild.id,
    User: user.id,
  });
  if (data) {
    data.Invites += amount;
    data.Total += amount;
    data.save();
  } else {
    new Schema({
      Guild: interaction.guild.id,
      User: user.id,
      Invites: amount,
      Total: amount,
      Left: 0,
    }).save();
  }

  client.succNormal(
    {
      text: `Se añadieron **${amount}** invitaciones a ${user}`,
      fields: [
        {
          name: "📨┆Invitaciones totales",
          value: `${data.Invites}`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
