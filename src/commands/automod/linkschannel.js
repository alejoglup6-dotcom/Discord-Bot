const Discord = require("discord.js");

const Schema = require("../../database/models/channelList");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const type = interaction.options.getString("type");
  const channel = interaction.options.getChannel("channel");

  if (type == "add") {
    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        if (data.Channels.includes(channel.id)) {
          return client.errNormal(
            {
              error: `¡El canal ${channel} ya está en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        data.Channels.push(channel.id);
        data.save();
      } else {
        new Schema({
          Guild: interaction.guild.id,
          Channels: channel.id,
        }).save();
      }
    });

    client.succNormal(
      {
        text: `¡El canal se añadió a la lista blanca!`,
        fields: [
          {
            name: `📘┆Canal`,
            value: `${channel} (${channel.name})`,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  } else if (type == "remove") {
    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        if (!data.Channels.includes(channel.id)) {
          return client.errNormal(
            {
              error: `¡El canal ${channel} no existe en la base de datos!`,
              type: "editreply",
            },
            interaction,
          );
        }

        const filtered = data.Channels.filter(
          (target) => target !== channel.id,
        );

        await Schema.findOneAndUpdate(
          { Guild: interaction.guild.id },
          {
            Guild: interaction.guild.id,
            Channels: filtered,
          },
        );

        client.succNormal(
          {
            text: `¡El canal se eliminó de la lista blanca!`,
            fields: [
              {
                name: `📘┆Canal`,
                value: `${channel} (${channel.name})`,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      } else {
        return client.errNormal(
          {
            error: `¡Este servidor no tiene datos!`,
            type: "editreply",
          },
          interaction,
        );
      }
    });
  }
};
