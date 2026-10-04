const Discord = require("discord.js");
const samp = require("../../database/samp");
const v = require("../../assets/utils/verification");

/*
 * Verificación con la cuenta del juego (src/assets/utils/verification.js): cada 30 segundos mira los enlaces de
 * discord_links (los crea la web en /verificar) y da el rol de verificado y el apodo; en modo "on" quita el rol a
 * quien no está vinculado. VERIFICACION = on | suave | off. RANGOS_GUILD limita a un servidor.
 */
module.exports = (client) => {
  let busy = false, lastFetch = 0;
  async function run() {
    if (v.MODE() === "off" || busy) return;
    busy = true;
    try {
      if (!(await samp.isAvailable())) return;
      const map = await v.links();
      for (const guild of client.guilds.cache.values()) {
        if (process.env.RANGOS_GUILD && guild.id !== process.env.RANGOS_GUILD) continue;
        const role = v.verifiedRole(guild);
        if (!role) continue;
        // la lista completa de miembros se pide cada 10 minutos; entre medias basta la caché (llegan por eventos)
        if (Date.now() - lastFetch > 600000) {
          await guild.members.fetch().catch(() => null);
          lastFetch = Date.now();
        }
        const log = (t) => console.log(`[verificación] ${guild.name}: ${t}`);
        for (const member of guild.members.cache.values()) await v.applyMember(member, map.get(member.id), role, log);
      }
    } catch (e) {
      console.log("[verificación]", e.message);
    } finally {
      busy = false;
    }
  }
  client.verificationSync = run;
  client.once(Discord.Events.ClientReady, () => {
    setTimeout(run, 20000);
    setInterval(run, 30000);
  });
  // Quien vuelve a entrar ya vinculado recupera rol y apodo enseguida
  client.on("guildMemberAdd", async (member) => {
    if (v.MODE() === "off") return;
    try {
      const link = (await v.links()).get(member.id);
      const role = v.verifiedRole(member.guild);
      if (link && role) await v.applyMember(member, link, role, () => {}, { welcome: false });
    } catch {}
  });
};
