const Discord = require("discord.js");

const welcomeChannel = require("../../database/models/welcomeChannels");
const welcomeRole = require("../../database/models/joinRole");
const leaveChannel = require("../../database/models/leaveChannels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const choice = interaction.options.getString("setup");

  if (choice == "welcomechannel") {
    interaction.guild.channels
      .create({
        name: "Bienvenida",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.createChannelSetup(welcomeChannel, ch, interaction);
      });
  }

  if (choice == "welcomerole") {
    interaction.guild.roles
      .create({
        name: "Miembro",
        color: client.config.colors.normal,
      })
      .then((rl) => {
        client.createRoleSetup(welcomeRole, rl, interaction);
      });
  }

  if (choice == "leavechannel") {
    interaction.guild.channels
      .create({
        name: "Despedida",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.createChannelSetup(leaveChannel, ch, interaction);
      });
  }
};
