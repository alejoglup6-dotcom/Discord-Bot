const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setLabel("Apoya a Drok")
      .setURL(client.config.discord.serverInvite)
      .setStyle(Discord.ButtonStyle.Link),
  );

  client.embed(
    {
      title: `${client.user.username}・Donar`,
      desc: "_____ \n\nHaz clic en el botón de abajo para apoyar a Drok \n**¡Atención! El apoyo no es obligatorio**",
      thumbnail: client.user.avatarURL({ dynamic: true }),
      components: [row],
      type: "editreply",
    },
    interaction,
  );
};
