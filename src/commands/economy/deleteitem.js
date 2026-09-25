const Discord = require("discord.js");

const store = require("../../database/models/economyStore");

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

  const role = interaction.options.getRole("role");

  if (!role)
    return client.errUsage(
      { usage: "deleteitem [rol]", type: "editreply" },
      interaction,
    );

  store
    .findOne({ Guild: interaction.guild.id, Role: role.id })
    .then(async (storeData) => {
      if (storeData) {
        var remove = await store.deleteOne({
          Guild: interaction.guild.id,
          Role: role.id,
        });

        client.succNormal(
          {
            text: `El rol se eliminó de la tienda`,
            fields: [
              {
                name: `🛒┆Rol`,
                value: `${role}`,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.errNormal(
          {
            error: `¡Este rol no está en la tienda!`,
            type: "editreply",
          },
          interaction,
        );
      }
    });
};
