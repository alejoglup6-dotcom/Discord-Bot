const Discord = require("discord.js");
const { tweetCard } = require("../../assets/utils/tweetCard");

// Parodia: la imagen lleva la etiqueta "PARODIA" para que no pase por un tuit real.
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const text = String(interaction.options.getString("text") || "").slice(0, 280);
  try {
    const png = await tweetCard({ nombre: "Donald J. Trump", usuario: "realDonaldTrump", avatar: null, texto: text, verificado: true, etiqueta: "PARODIA" });
    const file = new Discord.AttachmentBuilder(png, { name: "tuit.png" });
    return client.embed({ title: `🖼・Tuit de Trump (parodia)`, image: "attachment://tuit.png", files: [file], type: "editreply" }, interaction);
  } catch (e) {
    return client.errNormal({ error: `No pude crear la imagen: ${e.message}`, type: "editreply" }, interaction);
  }
};
