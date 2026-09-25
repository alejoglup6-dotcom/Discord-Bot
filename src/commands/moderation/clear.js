const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  const amount = interaction.options.getNumber("amount");

  if (amount > 100)
    return client.errNormal(
      {
        error: "¡No puedo eliminar más de 100 mensajes a la vez!",
        type: "editreply",
      },
      interaction,
    );

  if (amount < 1)
    return client.errNormal(
      {
        error: "¡No puedo eliminar menos de 1 mensaje!",
        type: "editreply",
      },
      interaction,
    );

  interaction.channel
    .bulkDelete(amount, true)
    .then(() => {
      client.succNormal(
        {
          text: `Eliminé los mensajes correctamente`,
          fields: [
            {
              name: "💬┆Cantidad",
              value: `${amount}`,
              inline: true,
            },
          ],
          type: "ephemeraledit",
        },
        interaction,
      );
    })
    .catch((err) => {
      client.errNormal(
        {
          error:
            "¡Hubo un error al intentar eliminar mensajes en este canal!",
          type: "editreply",
        },
        interaction,
      );
    });
};
