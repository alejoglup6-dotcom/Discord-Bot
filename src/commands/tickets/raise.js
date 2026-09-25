const Discord = require("discord.js");

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");

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

  ticketSchema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
    if (data) {
      const ticketCategory = interaction.guild.channels.cache.get(
        data.Category,
      );
      const ticketRole = interaction.guild.roles.cache.get(data.Role);

      if (ticketCategory == undefined) {
        return client.errNormal(
          {
            error: "¡Haz la configuración!",
            type: "editreply",
          },
          interaction,
        );
      }

      if (interaction.channel.parentId == ticketCategory.id) {
        try {
          interaction.channel.permissionOverwrites.edit(ticketRole, {
            ViewChannel: false,
            SendMessages: false,
            AttachFiles: false,
            ReadMessageHistory: false,
            AddReactions: false,
          });

          return client.simpleEmbed(
            {
              desc: `Prioridad del ticket subida por <@!${interaction.user.id}>`,
              type: "editreply",
            },
            interaction,
          );
        } catch {
          client.errNormal(
            {
              error: "¡Algo salió mal!",
              type: "editreply",
            },
            interaction,
          );
        }
      } else {
        client.errNormal(
          {
            error: "¡Esto no es un ticket!",
            type: "editreply",
          },
          interaction,
        );
      }
    } else {
      return client.errNormal(
        {
          error: "¡Haz la configuración!",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
