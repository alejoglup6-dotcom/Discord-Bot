const Discord = require("discord.js");
const axios = require("axios");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const color = interaction.options.getString("color");

  const { data } = await axios
    .get(`https://some-random-api.com/canvas/rgb?hex=${color}`)
    .catch((e) => {
      return client.errNormal(
        {
          error: "¡No se encontró el color!",
          type: "editreply",
        },
        interaction,
      );
    });

  client.embed(
    {
      title: `🎨・Información del color`,
      image: `https://some-random-api.com/canvas/colorviewer?hex=${color}`,
      color: `#${color}`,
      fields: [
        {
          name: "Hex",
          value: `#${color}`,
          inline: true,
        },
        {
          name: "RGB",
          value: `${data.r}, ${data.g}, ${data.b}`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
