const Discord = require("discord.js");
const Canvacord = require("canvacord");

const Functions = require("../../database/models/functions");
const Schema = require("../../database/models/levels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const data = await Functions.findOne({ Guild: interaction.guild.id });

  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  if (data && data.Levels == true) {
    const target = interaction.options.getUser("user");
    const level = interaction.options.getNumber("level");

    const user = await client.setLevel(target.id, interaction.guild.id, level);

    client.succNormal(
      {
        text: `El nivel se modificó correctamente`,
        fields: [
          {
            name: "🆕┆Nuevo nivel",
            value: `${user.level}`,
            inline: true,
          },
          {
            name: "👤┆Usuario",
            value: `${target} (${target.tag})`,
            inline: true,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  } else {
    client.errNormal(
      {
        error: "¡Los niveles están desactivados en este servidor!",
        type: "editreply",
      },
      interaction,
    );
  }
};
