const Discord = require("discord.js");
const axios = require("axios");

const model = require("../../database/models/badge");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let Emojis = "";
  let EmojisAnimated = "";
  let EmojiCount = 0;
  let Animated = 0;
  let OverallEmojis = 0;

  function Emoji(id) {
    return client.emojis.cache.get(id).toString();
  }

  interaction.guild.emojis.cache.forEach((emoji) => {
    OverallEmojis++;
    if (emoji.animated) {
      Animated++;
      EmojisAnimated += Emoji(emoji.id);
    } else {
      EmojiCount++;
      Emojis += Emoji(emoji.id);
    }
  });

  client.embed(
    {
      title: `😛・¡Emojis!`,
      desc: `${OverallEmojis} emojis - ${interaction.guild.name}`,
      fields: [
        {
          name: `Animados [${Animated}]`,
          value: EmojisAnimated.substr(0, 1021) + "...",
          inline: false,
        },
        {
          name: `Estándar [${EmojiCount}]`,
          value: Emojis.substr(0, 1021) + "...",
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
