const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var result = Math.ceil(Math.random() * 6);

  client.embed(
    {
      title: `🎲・Dado`,
      desc: `Sacaste ${result}`,
      type: "editreply",
    },
    interaction,
  );
};
