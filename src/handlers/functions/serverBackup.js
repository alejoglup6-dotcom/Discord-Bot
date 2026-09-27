const Discord = require("discord.js");

const store = require("../../database/serverBackup");
const { createBackup } = require("../../assets/utils/serverBackup");

/*
 * Copia de seguridad automática de cada servidor cada BACKUP_INTERVAL_HOURS horas (12 por defecto).
 * Se revisa cada 30 minutos si ya toca, así que aunque el bot se reinicie no se salta ninguna ni se hacen de más.
 * Se apaga con BACKUP_ENABLED=false. La copia a mano es /backup crear.
 */
const CHECK = 30 * 60000;
const HOURS = () => parseFloat(process.env.BACKUP_INTERVAL_HOURS) || 12;

module.exports = (client) => {
  if (String(process.env.BACKUP_ENABLED).toLowerCase() === "false") return;

  async function check() {
    for (const guild of client.guilds.cache.values()) {
      try {
        const last = await store.lastBackupDate(guild.id, "auto");
        if (last && Date.now() - last.getTime() < HOURS() * 3600000 - 60000) continue;
        const started = Date.now();
        const r = await createBackup(client.rest, guild.id, { kind: "auto" });
        const secs = Math.round((Date.now() - started) / 1000);
        console.log(`Copia de seguridad #${r.id} de ${guild.name}: ${r.messages.messages} mensajes nuevos, ${r.messages.files} archivos, ${secs} s`);
      } catch (err) {
        console.log(`Copia de seguridad de ${guild.name}:`, err.message);
      }
    }
  }

  client.once(Discord.Events.ClientReady, async () => {
    await store.init().catch((err) => console.log("Copias de seguridad:", err.message));
    setTimeout(check, 2 * 60000);
    setInterval(check, CHECK);
  });
};
