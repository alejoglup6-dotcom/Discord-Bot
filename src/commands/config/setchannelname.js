const Discord = require("discord.js");

const Schema = require("../../database/models/stats");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageChannels],
      perms: [Discord.PermissionsBitField.Flags.ManageChannels],
    },
    interaction,
  );

  if (perms == false) return;

  const name = interaction.options.getString("name");

  if (name.toUpperCase() == "HELP") {
    return client.embed(
      {
        title: `ℹ️・Opciones del nombre del canal`,
        desc: `Estas son las opciones del nombre del canal: \n
            \`{emoji}\` - Emoji del canal
            \`{name}\` - Nombre del canal`,
        type: "editreply",
      },
      interaction,
    );
  }

  Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (data) {
      data.ChannelTemplate = name;
      data.save();
    } else {
      new Schema({
        Guild: interaction.guild.id,
        ChannelTemplate: name,
      }).save();
    }

    client.succNormal(
      {
        text: `El nombre del canal se guardó correctamente`,
        fields: [
          {
            name: `💬┆Nombre`,
            value: `${name}`,
            inline: true,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  });
};
