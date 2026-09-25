const Discord = require("discord.js");
const figlet = require("figlet");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const msg = interaction.options.getString("text");

  if (msg.length > 2000)
    return client.errNormal(
      {
        error: "¡Escribe un texto de menos de 2000 caracteres!",
        type: "editreply",
      },
      interaction,
    );

  figlet.text(msg, function (err, data) {
    if (err) {
      return client.errNormal(
        { error: "¡Algo salió mal!", type: "editreply" },
        interaction,
      );
    }

    client.embed(
      {
        title: "💬・Ascii",
        desc: `\`\`\` ${data} \`\`\``,
        type: "editreply",
      },
      interaction,
    );
  });
};
