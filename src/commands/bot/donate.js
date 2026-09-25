const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setLabel("CorwinDev GitHub")
      .setURL("https://github.com/sponsors/CorwinDev")
      .setStyle(Discord.ButtonStyle.Link),
  );

  client.embed(
    {
      title: `${client.user.username}・Donar`,
      desc: "_____ \n\nHaz clic en el botón de abajo para ir a la página de patrocinio \n**¡Atención! El patrocinio no es obligatorio**",
      thumbnail: client.user.avatarURL({ dynamic: true }),
      url: "https://github.com/sponsors/CorwinDev",
      components: [row],
      type: "editreply",
    },
    interaction,
  );
};
