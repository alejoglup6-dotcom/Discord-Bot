const { noteTyping } = require("../../assets/utils/iaChat");

/**
 * Alguien empezó a escribir: la IA lo sabe para poder decir quién está escribiendo en el canal.
 * (Necesita el intent GuildMessageTyping, que el bot ya tiene.)
 */
module.exports = async (client, typing) => {
  try {
    if (!typing?.user || typing.user.bot) return;
    const channel = typing.channel;
    if (!channel?.guild) return;
    noteTyping(channel.id, typing.user, typing.member);
  } catch {}
};
