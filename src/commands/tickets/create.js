const Discord = require("discord.js");

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");
const ticketMessageConfig = require("../../database/models/ticketMessage");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let reason = "No indicada";
  if (interaction.options)
    reason = interaction.options.getString("reason") || "No indicada";

  let type = "reply";
  if (interaction.isCommand()) type = "editreply";

  ticketChannels
    .findOne({
      Guild: interaction.guild.id,
      creator: interaction.user.id,
      resolved: false,
    })
    .then(async (data) => {
      if (data) {
        if (interaction.isCommand()) {
          return client.errNormal(
            {
              error: "Límite de tickets alcanzado. 1/1",
              type: "ephemeraledit",
            },
            interaction,
          );
        } else
          return client.errNormal(
            {
              error: "Límite de tickets alcanzado. 1/1",
              type: "ephemeral",
            },
            interaction,
          );
      } else {
        ticketSchema
          .findOne({ Guild: interaction.guild.id })
          .then(async (TicketData) => {
            if (TicketData) {
              const logsChannel = interaction.guild.channels.cache.get(
                TicketData.Logs,
              );
              const ticketCategory = interaction.guild.channels.cache.get(
                TicketData.Category,
              );
              const ticketRole = interaction.guild.roles.cache.get(
                TicketData.Role,
              );
              let role = interaction.guild.roles.cache.find(
                (r) => r.id === ticketRole.id,
              );

              try {
                var openTicket =
                  "¡Gracias por crear un ticket! \nEl equipo de soporte te atenderá en breve \n\n🔒 - Cerrar ticket \n✋ - Reclamar ticket \n📝 - Guardar transcripción \n🔔 - Enviar una notificación";
                let ticketMessageData = await ticketMessageConfig.findOne({
                  Guild: interaction.guild.id,
                });
                if (ticketMessageData) {
                  openTicket = ticketMessageData.openTicket;
                }

                const row = new Discord.ActionRowBuilder().addComponents(
                  new Discord.ButtonBuilder()
                    .setCustomId("Bot_closeticket")
                    .setEmoji("🔒")
                    .setStyle(Discord.ButtonStyle.Primary),

                  new Discord.ButtonBuilder()
                    .setCustomId("Bot_claimTicket")
                    .setEmoji("✋")
                    .setStyle(Discord.ButtonStyle.Primary),

                  new Discord.ButtonBuilder()
                    .setCustomId("Bot_transcriptTicket")
                    .setEmoji("📝")
                    .setStyle(Discord.ButtonStyle.Primary),

                  new Discord.ButtonBuilder()
                    .setCustomId("Bot_noticeTicket")
                    .setEmoji("🔔")
                    .setStyle(Discord.ButtonStyle.Primary),
                );

                client
                  .embed(
                    {
                      title: `${client.emotes.animated.loading}・Progreso`,
                      desc: `Se está creando tu ticket...`,
                      type: "ephemeral",
                    },
                    interaction,
                  )
                  .then((msg) => {
                    if (TicketData.TicketCount) {
                      TicketData.TicketCount += 1;
                      TicketData.save();
                    } else {
                      TicketData.TicketCount = 1;
                      TicketData.save();
                    }

                    if (ticketCategory == undefined) {
                      return client.errNormal(
                        {
                          error: "¡Haz la configuración!",
                          type: type,
                        },
                        interaction,
                      );
                    } else {
                      let category = interaction.guild.channels.cache.find(
                        (c) => c.id === ticketCategory.id,
                      );

                      let permsToHave = [
                        Discord.PermissionsBitField.Flags.AddReactions,
                        Discord.PermissionsBitField.Flags.SendMessages,
                        Discord.PermissionsBitField.Flags.ViewChannel,
                        Discord.PermissionsBitField.Flags.AttachFiles,
                        Discord.PermissionsBitField.Flags.ReadMessageHistory,
                      ];

                      var ticketid = String(TicketData.TicketCount).padStart(
                        4,
                        0,
                      );

                      interaction.guild.channels
                        .create({
                          name: `ticket-${ticketid}`,
                          permissionOverwrites: [
                            {
                              deny: [
                                Discord.PermissionsBitField.Flags.ViewChannel,
                              ],
                              id: interaction.guild.id,
                            },
                            {
                              allow: permsToHave,
                              id: interaction.user.id,
                            },
                            {
                              allow: permsToHave,
                              id: role.id,
                            },
                          ],
                          parent: category.id,
                        })
                        .then(async (channel) => {
                          client.embed(
                            {
                              title: `⚙️・Sistema`,
                              desc: `El ticket se creó`,
                              fields: [
                                {
                                  name: "👤┆Creador",
                                  value: `${interaction.user}`,
                                  inline: true,
                                },
                                {
                                  name: "📂┆Canal",
                                  value: `${channel}`,
                                  inline: true,
                                },
                                {
                                  name: "⏰┆Creado el",
                                  value: `<t:${(Date.now() / 1000).toFixed(0)}:f>`,
                                  inline: true,
                                },
                              ],
                              type: type,
                            },
                            interaction,
                          );

                          new ticketChannels({
                            Guild: interaction.guild.id,
                            TicketID: ticketid,
                            channelID: channel.id,
                            creator: interaction.user.id,
                            claimed: "None",
                          }).save();

                          if (logsChannel) {
                            client.embed(
                              {
                                title: `📝・Ticket abierto`,
                                desc: `Se creó un nuevo ticket`,
                                fields: [
                                  {
                                    name: "👤┆Creador",
                                    value: `${interaction.user.tag} (${interaction.user.id})`,
                                    inline: false,
                                  },
                                  {
                                    name: "📂┆Canal",
                                    value: `${channel.name} está en ${channel}`,
                                    inline: false,
                                  },
                                  {
                                    name: "⏰┆Creado el",
                                    value: `<t:${(Date.now() / 1000).toFixed(0)}:F>`,
                                    inline: false,
                                  },
                                ],
                              },
                              logsChannel,
                            );
                          }

                          await client.embed(
                            {
                              desc: openTicket,
                              fields: [
                                {
                                  name: "👤┆Creador",
                                  value: `${interaction.user}`,
                                  inline: true,
                                },
                                {
                                  name: "📄┆Asunto",
                                  value: `${reason}`,
                                  inline: true,
                                },
                                {
                                  name: "⏰┆Creado el",
                                  value: `<t:${(Date.now() / 1000).toFixed(0)}:F>`,
                                  inline: true,
                                },
                              ],
                              components: [row],
                              content: `${interaction.user}, ${role}`,
                            },
                            channel,
                          );
                        });
                    }
                  });
              } catch (err) {
                client.errNormal(
                  {
                    error: "¡Haz la configuración!",
                    type: type,
                  },
                  interaction,
                );
                console.log(err);
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
