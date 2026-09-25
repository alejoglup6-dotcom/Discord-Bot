const Discord = require("discord.js");

const inviteMessages = require("../../database/models/inviteMessages");

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

  const message = interaction.options.getString("message");

  if (message.toUpperCase() == "HELP") {
    return client.embed(
      {
        title: `ℹ️・Opciones del mensaje de bienvenida`,
        desc: `Opciones del mensaje de despedida: \n
            \`{user:username}\` - Nombre de usuario
            \`{user:discriminator}\` - Discriminador del usuario
            \`{user:tag}\` - Tag del usuario
            \`{user:mention}\` - Mencionar al usuario

            \`{inviter:username}\` - Nombre de quien lo invitó
            \`{inviter:discriminator}\` - Discriminador de quien lo invitó
            \`{inviter:tag}\` - Tag de quien lo invitó
            \`{inviter:mention}\` - Mención de quien lo invitó
            \`{inviter:invites}\` - Invitaciones de quien lo invitó
            \`{inviter:invites:left}\` - Invitaciones perdidas de quien lo invitó
            
            \`{guild:name}\` - Nombre del servidor
            \`{guild:members}\` - Número de miembros del servidor`,
        type: "editreply",
      },
      interaction,
    );
  }

  if (message.toUpperCase() == "DEFAULT") {
    inviteMessages
      .findOne({ Guild: interaction.guild.id })
      .then(async (data) => {
        if (data) {
          data.inviteLeave = null;
          data.save();

          client.succNormal(
            {
              text: `¡Mensaje de despedida eliminado!`,
              type: "editreply",
            },
            interaction,
          );
        }
      });
  } else {
    inviteMessages
      .findOne({ Guild: interaction.guild.id })
      .then(async (data) => {
        if (data) {
          data.inviteLeave = message;
          data.save();
        } else {
          new inviteMessages({
            Guild: interaction.guild.id,
            inviteLeave: message,
          }).save();
        }

        client.succNormal(
          {
            text: `El mensaje de despedida se guardó correctamente`,
            fields: [
              {
                name: `💬┆Mensaje`,
                value: `${message}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      });
  }
};
