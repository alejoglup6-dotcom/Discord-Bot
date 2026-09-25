const Discord = require("discord.js");

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");
const ticketMessageConfig = require("../../database/models/ticketMessage");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const data = await ticketSchema.findOne({ Guild: interaction.guild.id });
  const ticketData = await ticketChannels.findOne({
    Guild: interaction.guild.id,
    channelID: interaction.channel.id,
  });

  let type = "reply";
  if (interaction.isCommand()) type = "editreply";

  if (ticketData) {
    if (ticketData.resolved == true)
      return client.errNormal(
        {
          error: "¡El ticket ya está cerrado!",
          type: "ephemeraledit",
        },
        interaction,
      );

    if (data) {
      const ticketCategory = interaction.guild.channels.cache.get(
        data.Category,
      );
      const logsChannel = interaction.guild.channels.cache.get(data.Logs);

      if (ticketCategory == undefined) {
        return client.errNormal(
          {
            error: "¡Haz la configuración!",
            type: type,
          },
          interaction,
        );
      }

      if (
        interaction.guild.channels.cache.find((c) => c.id === ticketCategory.id)
      ) {
        client.users.fetch(ticketData.creator).then(async (usr) => {
          interaction.channel.permissionOverwrites.edit(usr, {
            ViewChannel: false,
            SendMessages: false,
            AttachFiles: false,
            ReadMessageHistory: false,
            AddReactions: false,
          });

          try {
            var closeMessageTicket =
              "Aquí tienes la transcripción de tu ticket. ¡Guárdala por si alguna vez necesitas consultarla!";
            let ticketMessageData = await ticketMessageConfig.findOne({
              Guild: interaction.guild.id,
            });
            if (ticketMessageData) {
              closeMessageTicket = ticketMessageData.dmMessage;
            }

            client.embed(
              {
                desc: closeMessageTicket,
                fields: [
                  {
                    name: "👤┆Cerrado por",
                    value: `${interaction.user}`,
                    inline: true,
                  },
                  {
                    name: "📄┆ID del ticket",
                    value: `${ticketData.TicketID}`,
                    inline: true,
                  },
                  {
                    name: "💬┆Servidor",
                    value: `${interaction.guild.name}`,
                    inline: true,
                  },
                ],
              },
              usr,
            );
            client.transcript(interaction, usr).catch(() => {});
          } catch (err) {}
        });

        if (logsChannel) {
          client.embed(
            {
              title: `🔒・Ticket cerrado`,
              desc: `El ticket está cerrado`,
              color: client.config.colors.error,
              fields: [
                {
                  name: "📘┆ID del ticket",
                  value: `${ticketData.TicketID}`,
                },
                {
                  name: "👤┆Cerrado por",
                  value: `${interaction.user.tag} (${interaction.user.id})`,
                },
                {
                  name: "👤┆Creador",
                  value: `<@!${ticketData.creator}>`,
                },
                {
                  name: "✋┆Reclamado por",
                  value: `<@!${ticketData.creator}>`,
                },
                {
                  name: "⏰┆Fecha",
                  value: `<t:${(Date.now() / 1000).toFixed(0)}:F>`,
                },
              ],
            },
            logsChannel,
          );
          client.transcript(interaction, logsChannel);
        }

        ticketData.resolved = true;
        ticketData.save();

        interaction.channel.edit({ name: `ticket-closed` });
        client.simpleEmbed(
          {
            desc: `Ticket cerrado por <@!${interaction.user.id}>`,
            type: type,
          },
          interaction,
        );

        const row = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("Bot_transcriptTicket")
            .setEmoji("📝")
            .setStyle(Discord.ButtonStyle.Primary),

          new Discord.ButtonBuilder()
            .setCustomId("Bot_openTicket")
            .setEmoji("🔓")
            .setStyle(Discord.ButtonStyle.Primary),

          new Discord.ButtonBuilder()
            .setCustomId("Bot_deleteTicket")
            .setEmoji("⛔")
            .setStyle(Discord.ButtonStyle.Danger),
        );

        client.embed(
          {
            title: "🔒・Cerrado",
            desc: `📝 - Guardar transcripción \n🔓 - Reabrir ticket \n⛔ - Eliminar ticket`,
            components: [row],
          },
          interaction.channel,
        );
      } else {
        return client.errNormal(
          {
            error: "¡Haz la configuración de tickets!",
            type: type,
          },
          interaction,
        );
      }
    } else {
      return client.errNormal(
        {
          error: "¡Haz la configuración de tickets!",
          type: type,
        },
        interaction,
      );
    }
  }
};
