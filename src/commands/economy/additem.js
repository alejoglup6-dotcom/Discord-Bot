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
  let amount = interaction.options.getNumber("amount");

  if (!role || !amount)
    return client.errUsage(
      { usage: "additem [rol] [cantidad]", type: "editreply" },
      interaction,
    );

  if (isNaN(amount))
    return client.errNormal(
      { error: "¡Introduce un número válido!", type: "editreply" },
      interaction,
    );

  if (role == interaction.guild.roles.everyone)
    return client.errNormal(
      {
        error: "¡No puedes añadir el rol everyone a la tienda!",
        type: "editreply",
      },
      interaction,
    );

  store
    .findOne({ Guild: interaction.guild.id, Role: role.id })
    .then(async (storeData) => {
      if (storeData) {
        client.errNormal(
          { error: `¡Este rol ya está en la tienda!`, type: "editreply" },
          interaction,
        );
      } else {
        new store({
          Guild: interaction.guild.id,
          Role: role.id,
          Amount: amount,
        }).save();

        client.succNormal(
          {
            text: `¡El rol se añadió a la tienda!`,
            fields: [
              {
                name: `🛒┆Rol`,
                value: `<@&${role.id}>`,
                inline: true,
              },
              {
                name: `${client.emotes.economy.coins}┆Cantidad`,
                value: `$${amount}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      }
    });
};
