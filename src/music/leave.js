// Destruye el reproductor y avisa en el canal de texto una sola vez,
// aunque varios eventos (cola vacía, desconexión, expulsión) lleguen a la vez.
module.exports = (client, player, message) => {
  if (player.data.get("leaving")) return;
  player.data.set("leaving", true);

  player.destroy().catch(() => {});

  const channel = client.channels.cache.get(player.textId);
  if (!channel) return;

  client.errNormal({ error: message }, channel);
};
