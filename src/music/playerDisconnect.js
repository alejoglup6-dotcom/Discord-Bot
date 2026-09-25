const Discord = require("discord.js");

module.exports = (client, player) => {
  player.destroy();

  const channel = client.channels.cache.get(player.textId);
  client.errNormal(
    {
      error: "La música se detuvo. Me desconecté del canal",
    },
    channel,
  );
};
