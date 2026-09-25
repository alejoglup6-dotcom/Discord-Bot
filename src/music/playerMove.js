const leave = require("./leave");

module.exports = (client, player, state, channels) => {
  if (state === "LEFT") {
    return leave(client, player, "La música se detuvo. Me desconecté del canal");
  }

  if (state === "MOVED") {
    player.setVoiceChannel(channels.newChannelId);
    if (player.paused) return;
    setTimeout(() => {
      player.pause(true);
      setTimeout(() => player.pause(false), client.ws.ping * 2);
    }, client.ws.ping * 2);
  }
};
