const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const text = interaction.options.getString("text");

  let encode = text
    .split("")
    .map((x) => x.charCodeAt(0).toString(2))
    .join(" ");

  client.embed(
    {
      title: `${client.emotes.normal.check}・¡Listo!`,
      desc: `Convertí el texto a binario`,
      fields: [
        {
          name: "📥┇Entrada",
          value: `\`\`\`${text}\`\`\``,
          inline: false,
        },
        {
          name: "📤┇Salida",
          value: `\`\`\`${encode}\`\`\``,
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
