const Discord = require("discord.js");

module.exports = (client, player, track) => {
  player.destroy();

  const channel = client.channels.cache.get(player.textId);
  client.errNormal(
    {
      error: "La cola está vacía, salgo del canal de voz",
    },
    channel,
  );
};
