const Discord = require("discord.js");
const img = require("../../assets/utils/imagenesDivertidas");

// Imagen dibujada en el bot (src/assets/utils/imagenesDivertidas.js); antes dependía de node-canvas o canvacord
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const users = ["user1", "user2", "user3"].map((n) => interaction.options.getUser(n) || interaction.user);

  try {
    const buffer = await img.podio(users.map((u) => ({ avatar: u.displayAvatarURL({ size: 512, extension: "png", forceStatic: true }), nombre: u.username })));
    const attach = new Discord.AttachmentBuilder(buffer, { name: "podium.png" });
    const embed = client.templateEmbed().setImage("attachment://podium.png");
    return interaction.editReply({ files: [attach], embeds: [embed] });
  } catch (e) {
    console.log(`[images] podium: ${e.message}`);
    return client.errNormal({ error: "No pude hacer la imagen ahora. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }
};
