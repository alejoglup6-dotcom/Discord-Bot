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

  let type = "reply";
  if (interaction.isCommand()) type = "editreply";

  ticketChannels
    .findOne({ Guild: interaction.guild.id, channelID: interaction.channel.id })
    .then(async (ticketData) => {
      if (ticketData) {
        if (interaction.user.id !== ticketData.creator) {
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
                      type: type,
                    },
                    interaction,
                  );
                }

                if (interaction.channel.parentId == ticketCategory.id) {
                  client.simpleEmbed(
                    {
                      desc: `Hola <@!${ticketData.creator}>, \n\n¿Todavía podemos ayudarte? \nSi no hay respuesta en **24 horas**, cerraremos este ticket \n\n- Equipo de ${interaction.guild.name}`,
                      content: `<@!${ticketData.creator}>`,
                      type: type,
                    },
                    interaction,
                  );
                } else {
                  client.errNormal(
                    {
                      error: "¡Esto no es un ticket!",
                      type: type,
                    },
                    interaction,
                  );
                }
              } else {
                return client.errNormal(
                  {
                    error: "¡Haz la configuración!",
                    type: type,
                  },
                  interaction,
                );
              }
            });
        } else {
          return client.errNormal(
            {
              error: "¡No puedes enviar un aviso a tu propio ticket!",
              type: "ephemeral",
            },
            interaction,
          );
        }
      }
    });
};
