const Discord = require("discord.js");

const Schema = require("../../database/models/userBans");

const webhookClientLogs = new Discord.WebhookClient({
  id: "",
  token: "",
});

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const boolean = interaction.options.getBoolean("new");
  const member = interaction.options.getUser("user");

  if (boolean == true) {
    if (member.id === interaction.user.id) {
      // add the check here
      return client.errNormal(
        {
          error: `No puedes banearte a ti mismo del bot`,
          type: `editreply`,
        },
        interaction,
      );
    }

    Schema.findOne({ User: member.id }).then(async (data) => {
      if (data) {
        return client.errNormal(
          {
            error: `<@!${member.id}> (${member.id}) ya está baneado del bot`,
            type: `editreply`,
          },
          interaction,
        );
      } else {
        new Schema({
          User: member.id,
        }).save();

        client.succNormal(
          {
            text: `<@!${member.id}> (${member.id}) fue baneado del bot`,
            type: "editreply",
          },
          interaction,
        );

        let embedLogs = new Discord.EmbedBuilder()
          .setTitle(`🔨・Baneo añadido`)
          .setDescription(`<@!${member.id}> (${member.id}) fue baneado del bot`)
          .addFields({
            name: "👤┆Baneado por",
            value: `${interaction.user} (${interaction.user.tag})`,
            inline: true,
          })
          .setColor(client.config.colors.normal)
          .setFooter({ text: client.config.discord.footer })
          .setTimestamp();
        webhookClientLogs.send({
          username: "Bot Bans",
          embeds: [embedLogs],
        });
      }
    });
  } else if (boolean == false) {
    Schema.findOne({ User: member.id }).then(async (data) => {
      if (data) {
        Schema.findOneAndDelete({ User: member.id }).then(() => {
          client.succNormal(
            {
              text: `<@!${member.id}> (${member.id}) fue desbaneado del bot`,
              type: "editreply",
            },
            interaction,
          );

          let embedLogs = new Discord.EmbedBuilder()
            .setTitle(`🔨・Baneo eliminado`)
            .setDescription(
              `<@!${member.id}> (${member.id}) fue desbaneado del bot`,
            )
            .addFields({
              name: "👤┆Desbaneado por",
              value: `${interaction.user} (${interaction.user.tag})`,
              inline: true,
            })
            .setColor(client.config.colors.normal)
            .setFooter({ text: client.config.discord.footer })
            .setTimestamp();
          webhookClientLogs.send({
            username: "Bot Bans",
            embeds: [embedLogs],
          });
        });
      } else {
        return client.errNormal(
          {
            error: `<@!${member.id}> (${member.id}) no está baneado del bot`,
            type: `editreply`,
          },
          interaction,
        );
      }
    });
  }
};
