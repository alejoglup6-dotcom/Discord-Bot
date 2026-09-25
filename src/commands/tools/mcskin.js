const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const name = interaction.options.getString("name");

  if (name == null)
    return client.errUsage(
      { usage: "mcskin [nombre del jugador]", type: "editreply" },
      interaction,
    );

  client.embed(
    {
      title: `🎮・Skin de ${name}`,
      image: `https://minotar.net/armor/body/${name}/700.png`,
      type: "editreply",
    },
    interaction,
  );
};
