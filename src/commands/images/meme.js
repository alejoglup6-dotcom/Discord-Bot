const Discord = require("discord.js");
const { pedirJson, errorApi } = require("../../assets/utils/apiExterna");

// Reddit bloquea a los bots desde 2026 (403): se usa meme-api.com, que trae memes de Reddit (primero en español).
const SUBS = ["MemesESP", "memes", "dankmemes"];

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let ultimo = null;
  for (const sub of SUBS) {
    try {
      const m = await pedirJson(`https://meme-api.com/gimme/${sub}`);
      if (!m || !m.url || m.nsfw) continue;
      const embed = new Discord.EmbedBuilder()
        .setTitle(String(m.title || "Meme").slice(0, 256))
        .setURL(m.postLink || null)
        .setImage(m.url)
        .setColor(client.config.colors.normal)
        .setFooter({ text: `👍 ${m.ups ?? 0} | r/${m.subreddit || sub}` });
      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      ultimo = e;
    }
  }
  return errorApi(client, interaction, ultimo || new Error("no llegó ningún meme"), "un meme");
};
