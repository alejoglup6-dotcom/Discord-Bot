const Discord = require("discord.js");

// El webhook de comentarios vive en el .env (FEEDBACK_WEBHOOK_ID / FEEDBACK_WEBHOOK_TOKEN).
// Nunca pongas tokens en el código.
const webhookClient =
  process.env.FEEDBACK_WEBHOOK_ID && process.env.FEEDBACK_WEBHOOK_TOKEN
    ? new Discord.WebhookClient({
        id: process.env.FEEDBACK_WEBHOOK_ID,
        token: process.env.FEEDBACK_WEBHOOK_TOKEN,
      })
    : null;

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const feedback = interaction.options.getString("feedback");

  if (!webhookClient)
    return client.errNormal(
      { error: `El envío de comentarios no está configurado.`, type: "editreply" },
      interaction,
    );

  const embed = new Discord.EmbedBuilder()
    .setTitle(`📝・¡Nuevos comentarios!`)
    .addFields({
      name: "Usuario",
      value: `${interaction.user} (${interaction.user.tag})`,
      inline: true,
    })
    .setDescription(`${feedback}`.slice(0, 4000))
    .setColor(client.config.colors.normal);
  await webhookClient
    .send({
      username: "Bot Feedback",
      embeds: [embed],
    })
    .catch((e) => console.error("[feedback] webhook:", e.message));

  client.succNormal(
    {
      text: `Comentarios enviados correctamente a los desarrolladores`,
      type: "editreply",
    },
    interaction,
  );
};
