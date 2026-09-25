const leave = require("./leave");

module.exports = (client, player) => {
  leave(client, player, "La música se detuvo. Me desconecté del canal");
};
