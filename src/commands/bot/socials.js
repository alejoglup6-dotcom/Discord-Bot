const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setLabel("Servidor de soporte")
      .setURL(client.config.discord.serverInvite)
      .setStyle(Discord.ButtonStyle.Link),

    new Discord.ButtonBuilder()
      .setLabel("Invitar al bot")
      .setURL(client.config.discord.botInvite)
      .setStyle(Discord.ButtonStyle.Link),
  );

  client.embed(
    {
      title: `🌐・Redes`,
      desc: `¡Sigue a ${client.user.username} y únete a la comunidad!`,
      components: [row],
      type: "editreply",
    },
    interaction,
  );
};
