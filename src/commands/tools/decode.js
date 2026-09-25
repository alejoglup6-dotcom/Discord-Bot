const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const code = interaction.options.getString("code");

  if (isNaN(parseInt(code)))
    return client.errNormal(
      {
        error: `¡Solo puedes decodificar código binario!`,
        type: "editreply",
      },
      interaction,
    );

  let decode = code
    .split(" ")
    .map((bin) => String.fromCharCode(parseInt(bin, 2)))
    .join("");

  client.embed(
    {
      title: `${client.emotes.normal.check}・¡Listo!`,
      desc: `Decodifiqué el código`,
      fields: [
        {
          name: "📥 - Entrada",
          value: `\`\`\`${code}\`\`\``,
          inline: false,
        },
        {
          name: "📥 - Salida",
          value: `\`\`\`${decode}\`\`\``,
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
