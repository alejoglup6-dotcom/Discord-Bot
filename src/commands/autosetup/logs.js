const Discord = require("discord.js");

const logs = require("../../database/models/logChannels");
const boostLogs = require("../../database/models/boostChannels");
const levelLogs = require("../../database/models/levelChannels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const choice = interaction.options.getString("setup");

  if (choice == "serverLogs") {
    interaction.guild.channels
      .create({
        name: "registros-del-servidor",
        permissionOverwrites: [
          {
            deny: [Discord.PermissionsBitField.Flags.ViewChannel],
            id: interaction.guild.id,
          },
        ],
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.createChannelSetup(logs, ch, interaction);
      });
  }

  if (choice == "levelLogs") {
    interaction.guild.channels
      .create({
        name: "registros-de-niveles",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.createChannelSetup(levelLogs, ch, interaction);
      });
  }

  if (choice == "boostLogs") {
    interaction.guild.channels
      .create({
        name: "boosts",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.createChannelSetup(boostLogs, ch, interaction);
      });
  }
};
