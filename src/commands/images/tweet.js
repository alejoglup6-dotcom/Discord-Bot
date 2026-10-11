const Discord = require("discord.js");
const { tweetCard } = require("../../assets/utils/tweetCard");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const text = String(interaction.options.getString("text") || "").slice(0, 280);
  try {
    const png = await tweetCard({
      nombre: interaction.member?.displayName || interaction.user.globalName || interaction.user.username,
      usuario: interaction.user.username,
      avatar: interaction.user.displayAvatarURL({ extension: "png", size: 128 }),
      texto: text,
    });
    const file = new Discord.AttachmentBuilder(png, { name: "tuit.png" });
    return client.embed({ title: `🖼・Tuit`, image: "attachment://tuit.png", files: [file], type: "editreply" }, interaction);
  } catch (e) {
    return client.errNormal({ error: `No pude crear la imagen: ${e.message}`, type: "editreply" }, interaction);
  }
};
