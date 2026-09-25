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
                return client
                  .simpleEmbed(
                    {
                      desc: `${client.emotes.animated.loading}・Guardando transcripción...`,
                      type: type,
                    },
                    interaction,
                  )
                  .then(async (editMsg) => {
                    client
                      .transcript(interaction, interaction.channel)
                      .then(() => {
                        return client.simpleEmbed(
                          {
                            desc: `Transcripción guardada`,
                            type: "editreply",
                          },
                          interaction,
                        );
                      });
                  });
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
      }
    });
};
