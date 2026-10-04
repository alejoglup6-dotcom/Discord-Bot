const Discord = require("discord.js");

const samp = require("../../database/samp");
const rangos = require("../../database/rangos");
const data = require("../../assets/data/rangos");
const invites = require("../../database/inviteRewards");

/*
 * Sincroniza los rangos del juego con los roles de Discord (tabla: docs/rangos/tabla-rangos.md).
 * Solo toca a los miembros con la cuenta vinculada (/samp link) y solo los roles de src/assets/data/rangos.js:
 *  - "auto": el juego manda (staff, facción y rango, banda, VIP/Socio, nivel, economía, logros): pone y quita.
 *  - "manual": cargos, creadores e insignias. Si se da en Discord, el juego también lo muestra (player_ranks);
 *    si se da en el juego (/darrango), el bot pone el rol. Quitar el rol en Discord quita lo que se dio en Discord.
 *  - "ref": escalón de invitados (invitaciones de Discord + referidos del juego): solo se agrega.
 *  - "pending" (facciones y niveles de staff que aún no existen en el juego) y los roles de año: no se tocan.
 * Crea los roles que falten y renombra SATV -> CITYTV y DIRECTOR SATV -> DIRECTOR DE PRENSA.
 *
 * Variables: RANGOS_SYNC = off (por defecto) | dry (solo muestra en la consola lo que haría) | on.
 *            RANGOS_SYNC_MINUTES (10 por defecto) y RANGOS_GUILD (id del servidor; si no, todos).
 */
const MODE = () => String(process.env.RANGOS_SYNC || "off").toLowerCase();

async function ensureRoles(guild, dry, log) {
  for (const [from, to] of Object.entries(data.RENAMES)) {
    const old = guild.roles.cache.find((r) => r.name === from);
    if (old && !guild.roles.cache.some((r) => r.name === to)) {
      log.push(`renombrar ${from} -> ${to}`);
      if (!dry && old.editable) await old.setName(to, "Rangos unificados").catch((e) => log.push(`  error: ${e.message}`));
    }
  }
  const needed = new Map();
  for (const r of data.RANKS) {
    needed.set(r.role, r.color || null);
    if (r.group && !needed.has(r.group)) needed.set(r.group, null);
  }
  for (const n of [data.VIP_ROLE, data.SOCIO_ROLE, data.LINKED_ROLE]) needed.set(n, null);
  for (const [name, color] of needed) {
    if (guild.roles.cache.some((r) => r.name === name) || (dry && Object.values(data.RENAMES).includes(name))) continue;
    log.push(`crear rol ${name}`);
    if (!dry) await guild.roles.create({ name, color: color || undefined, reason: "Rangos unificados juego <-> Discord" }).catch((e) => log.push(`  error: ${e.message}`));
  }
}

async function syncGuild(guild, dry) {
  const log = [];
  await ensureRoles(guild, dry, log);
  const states = await rangos.linkedStates();
  if (!states.length) return log;
  await guild.members.fetch().catch(() => null);
  const roleByName = (n) => guild.roles.cache.find((r) => r.name === n);

  for (const st of states) {
    const member = guild.members.cache.get(st.discordId);
    if (!member || member.user.bot) continue;
    const discordRefs = await invites.validInvites(guild.id, st.discordId).catch(() => 0);
    const p = rangos.plan(new Set(member.roles.cache.map((r) => r.name)), st, discordRefs);
    const add = p.add.map(roleByName).filter((r) => r && r.editable);
    const remove = p.remove.map(roleByName).filter((r) => r && r.editable);
    if (add.length || remove.length || p.saveManual.length || p.deleteManual.length)
      log.push(
        `${member.user.tag} (${st.name}):` +
          (add.length ? ` +[${add.map((r) => r.name).join(", ")}]` : "") +
          (remove.length ? ` -[${remove.map((r) => r.name).join(", ")}]` : "") +
          (p.saveManual.length ? ` juego+[${p.saveManual.join(", ")}]` : "") +
          (p.deleteManual.length ? ` juego-[${p.deleteManual.join(", ")}]` : ""),
      );
    if (dry) continue;
    if (add.length) await member.roles.add(add, "Rangos del juego").catch((e) => log.push(`  error al agregar: ${e.message}`));
    if (remove.length) await member.roles.remove(remove, "Rangos del juego").catch((e) => log.push(`  error al quitar: ${e.message}`));
    for (const k of p.saveManual) await rangos.saveManual(st.playerId, k).catch(() => {});
    for (const k of p.deleteManual) await rangos.deleteManual(st.playerId, k).catch(() => {});
    if (p.refKey && !st.manual.has(p.refKey)) await rangos.setRefTier(st.playerId, p.refKey).catch(() => {});
  }
  return log;
}

module.exports = (client) => {
  let busy = false;
  async function run() {
    const mode = MODE();
    if ((mode !== "on" && mode !== "dry") || busy) return;
    busy = true;
    try {
      if (!(await samp.isAvailable())) return;
      await rangos.init();
      for (const guild of client.guilds.cache.values()) {
        if (process.env.RANGOS_GUILD && guild.id !== process.env.RANGOS_GUILD) continue;
        const log = await syncGuild(guild, mode === "dry");
        if (log.length) console.log(`[rangos${mode === "dry" ? " (prueba, sin cambios)" : ""}] ${guild.name}\n  ` + log.join("\n  "));
      }
    } catch (e) {
      console.log("[rangos]", e);
    } finally {
      busy = false;
    }
  }
  client.rangosSync = run;
  client.once(Discord.Events.ClientReady, () => {
    if (MODE() !== "on" && MODE() !== "dry") return;
    setTimeout(run, 60000);
    setInterval(run, (parseInt(process.env.RANGOS_SYNC_MINUTES) || 10) * 60000);
  });
};
module.exports.syncGuild = syncGuild;
