const tiktokCreators = require("../../database/models/tiktokCreators");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const tools = client.tiktokTools;
  const user = tools ? tools.normalizeCreator(interaction.options.getString("user")) : null;
  if (!user) {
    return client.errNormal({ error: "Ese usuario de TikTok no es válido.", type: "editreply" }, interaction);
  }

  if (tools.envCreators.includes(user)) {
    return client.errNormal({ error: `@${user} está fijado en el .env (TIKTOK_CREATORS); quítalo de ahí y reinicia el bot.`, type: "editreply" }, interaction);
  }

  const data = await tiktokCreators.findOne({ Guild: interaction.guild.id, User: user });
  if (!data) {
    return client.errNormal({ error: `@${user} no está en la lista.`, type: "editreply" }, interaction);
  }

  await tiktokCreators.deleteOne({ Guild: interaction.guild.id, User: user });

  return client.succNormal({ text: `Quité a **@${user}** de la lista. Ya no se avisarán sus videos.`, type: "editreply" }, interaction);
};
