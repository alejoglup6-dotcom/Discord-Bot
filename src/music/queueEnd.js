const leave = require("./leave");

module.exports = (client, player) => {
  leave(client, player, "La cola está vacía, salgo del canal de voz");
};
