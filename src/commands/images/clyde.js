const Discord = require("discord.js");
const img = require("../../assets/utils/imagenesDivertidas");

// Imagen dibujada en el bot (src/assets/utils/imagenesDivertidas.js); antes dependía de node-canvas o canvacord
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const text = String(interaction.options.getString("text") || "").slice(0, 600);

  try {
    const buffer = await img.clyde(text);
    const attach = new Discord.AttachmentBuilder(buffer, { name: "clyde.png" });
    const embed = client.templateEmbed().setImage("attachment://clyde.png");
    return interaction.editReply({ files: [attach], embeds: [embed] });
  } catch (e) {
    console.log(`[images] clyde: ${e.message}`);
    return client.errNormal({ error: "No pude hacer la imagen ahora. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }
};
