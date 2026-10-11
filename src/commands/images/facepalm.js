const Discord = require("discord.js");
const img = require("../../assets/utils/imagenesDivertidas");

// Imagen dibujada en el bot (src/assets/utils/imagenesDivertidas.js); antes dependía de node-canvas o canvacord
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const member = interaction.options.getUser("user") || interaction.user;

  try {
    const buffer = await img.facepalm(member.displayAvatarURL({ size: 512, extension: "png", forceStatic: true }), member.username);
    const attach = new Discord.AttachmentBuilder(buffer, { name: "facepalm.png" });
    const embed = client.templateEmbed().setImage("attachment://facepalm.png");
    return interaction.editReply({ files: [attach], embeds: [embed] });
  } catch (e) {
    console.log(`[images] facepalm: ${e.message}`);
    return client.errNormal({ error: "No pude hacer la imagen ahora. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }
};
