const Discord = require("discord.js");

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const data = await ticketSchema.findOne({ Guild: interaction.guild.id });
  const ticketData = await ticketChannels.findOne({
    Guild: interaction.guild.id,
    channelID: interaction.channel.id,
  });

  if (ticketData) {
    if (interaction.user.id !== ticketData.creator) {
      const perms = await client.checkUserPerms(
        {
          flags: [Discord.PermissionsBitField.Flags.ManageMessages],
          perms: [Discord.PermissionsBitField.Flags.ManageMessages],
        },
        interaction,
      );

      if (perms == false) return;

      if (data) {
        if (
          ticketData.claimed == "" ||
          ticketData.claimed == undefined ||
          ticketData.claimed == "None"
        ) {
          client.errNormal(
            {
              text: "¡Ticket liberado!",
              type: "ephemeral",
            },
            interaction,
          );
        } else {
          if (ticketData.claimed == interaction.user.id) {
            const ticketCategory = interaction.guild.channels.cache.get(
              data.Category,
            );

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
              ticketData.claimed = "None";
              ticketData.save();

              return client.simpleEmbed(
                {
                  desc: `¡Este ticket ya se puede volver a reclamar!`,
                  type: "editreply",
                },
                interaction,
              );
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
            client.errNormal(
              {
                error: "¡No has reclamado este ticket!",
                type: "editreply",
              },
              interaction,
            );
          }
        }
      } else {
        return client.errNormal(
          {
            error: "¡Haz la configuración de tickets!",
            type: "editreply",
          },
          interaction,
        );
      }
    }
  }
};
