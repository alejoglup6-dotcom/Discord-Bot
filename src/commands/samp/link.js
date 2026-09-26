const Discord = require("discord.js");
const samp = require("../../database/samp");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const name = interaction.options.getString("name");

  const linked = await samp.getLinkedPlayer(interaction.user.id);
  if (linked)
    return client.errNormal(
      { error: `Ya tienes vinculada la cuenta ${linked.name}. Usa /samp unlink para cambiarla`, type: "editreply" },
      interaction,
    );

  const player = await samp.getPlayerByName(name);
  if (!player)
    return client.errNormal({ error: `No existe ninguna cuenta llamada ${name}`, type: "editreply" }, interaction);

  if (await samp.getLinkedDiscord(player.id))
    return client.errNormal(
      { error: `La cuenta ${player.name} ya está vinculada a otro Discord. Desvincúlala desde esa cuenta primero`, type: "editreply" },
      interaction,
    );

  const code = await samp.createLinkCode(interaction.user.id, player.name);

  // El código solo lo ve quien lo pidió
  await client.succNormal(
    { text: `Te envié el código para vincular **${client.samp.name(player.name)}** en un mensaje que solo ves tú.`, type: "editreply" },
    interaction,
  );
  await interaction.followUp({
    flags: Discord.MessageFlags.Ephemeral,
    content:
      `🔗 Entra al servidor con **${client.samp.name(player.name)}** y escribe:\n` +
      `\`\`\`/vincular ${code}\`\`\`` +
      `El código caduca en ${samp.LINK_CODE_MINUTES} minutos.`,
  });
};
