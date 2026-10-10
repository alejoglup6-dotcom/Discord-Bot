const Discord = require("discord.js");
const tickets = require("../../assets/utils/ticketsPro");

// Cada 15 minutos: aviso y cierre de tickets sin actividad y borrado de los cerrados (src/assets/utils/ticketsPro.js)
module.exports = (client) => {
  let busy = false;
  const run = async () => {
    if (busy) return;
    busy = true;
    await tickets.sweep(client).catch((e) => console.log("[tickets]", e.message));
    await require("../../assets/utils/ticketsResumen").tick(client).catch((e) => console.log("[tickets] resumen:", e.message)); // resumen semanal para el staff
    busy = false;
  };
  client.once(Discord.Events.ClientReady, () => {
    setTimeout(run, 90000);
    setInterval(run, 15 * 60000);
  });
};
