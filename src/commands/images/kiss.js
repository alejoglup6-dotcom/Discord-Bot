const Discord = require("discord.js");
const img = require("../../assets/utils/imagenesDivertidas");

// Imagen dibujada en el bot (src/assets/utils/imagenesDivertidas.js); antes dependía de node-canvas o canvacord
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const member = interaction.options.getUser("user") || interaction.user;

  try {
    const buffer = await img.besar(interaction.user.displayAvatarURL({ size: 512, extension: "png", forceStatic: true }), member.displayAvatarURL({ size: 512, extension: "png", forceStatic: true }), interaction.user.username, member.username);
    const attach = new Discord.AttachmentBuilder(buffer, { name: "kiss.png" });
    const embed = client.templateEmbed().setImage("attachment://kiss.png").setDescription(`**${Discord.escapeMarkdown(interaction.user.username)}** besó a **${Discord.escapeMarkdown(member.username)}**`);
    return interaction.editReply({ files: [attach], embeds: [embed] });
  } catch (e) {
    console.log(`[images] kiss: ${e.message}`);
    return client.errNormal({ error: "No pude hacer la imagen ahora. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }
};
