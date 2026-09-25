const Discord = require("discord.js");

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  ticketChannels
    .findOne({ Guild: interaction.guild.id, channelID: interaction.channel.id })
    .then(async (ticketData) => {
      if (ticketData) {
        ticketSchema
          .findOne({ Guild: interaction.guild.id })
          .then(async (data) => {
            if (data) {
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
                client
                  .embed(
                    {
                      desc: `${client.emotes.animated.loading}・Cargando información...`,
                      type: "editreply",
                    },
                    interaction,
                  )
                  .then((msg) => {
                    client.transcript(interaction, interaction.channel);

                    return client.embed(
                      {
                        title: `ℹ・Información`,
                        fields: [
                          {
                            name: "Nombre del ticket",
                            value: `\`${interaction.channel.name}\``,
                            inline: true,
                          },
                          {
                            name: "ID del canal",
                            value: `\`${interaction.channel.id}\``,
                            inline: true,
                          },
                          {
                            name: "Creador",
                            value: `<@!${ticketData.creator}>`,
                            inline: true,
                          },
                          {
                            name: "Reclamado por",
                            value: `<@!${ticketData.claimed}>`,
                            inline: true,
                          },
                          {
                            name: "ID del ticket",
                            value: `${ticketData.TicketID}`,
                            inline: true,
                          },
                        ],
                        type: "editreply",
                      },
                      msg,
                    );
                  });
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
      }
    });
};
