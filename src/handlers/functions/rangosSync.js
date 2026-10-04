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
 *  - Sanciones (MUTEADO, JAIL OOC, ADVERTENCIA 1-3): el juego manda. Plataforma y país: si el juego tiene el dato.
 *  - Un rol por banda ("🏴 nombre", con su color): se crea, se renombra y se borra con la banda.
 *  - Insignias automáticas (Donador, Usuario Diamante, Beta tester): rangos.autoBadges().
 *  - Los roles de año y los de avisos (🔔) no se tocan.
 * Crea los roles que falten y renombra SATV -> CITYTV y DIRECTOR SATV -> DIRECTOR DE PRENSA.
 * Limpieza (una vez, CLEANUP de src/assets/data/rangos.js): pasa los duplicados al rol bueno y los borra, borra 💎 VIP,
 * quita el permiso de Administrador a 🥊 BETA y pone 🎖 SHERIFF por encima de 🎖 ALGUACIL.
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
  const sr = data.SANCTION_ROLES;
  for (const n of [sr.muted, sr.oocJail, ...sr.warnings, ...Object.values(data.PLATFORM_ROLES), ...Object.values(data.COUNTRY_ROLES)])
    if (!needed.has(n)) needed.set(n, null);
  for (const [name, color] of needed) {
    if (guild.roles.cache.some((r) => r.name === name) || (dry && Object.values(data.RENAMES).includes(name))) continue;
    log.push(`crear rol ${name}`);
    if (!dry) await guild.roles.create({ name, color: color || undefined, reason: "Rangos unificados juego <-> Discord" }).catch((e) => log.push(`  error: ${e.message}`));
  }
}

// Limpieza del servidor (se repite en cada vuelta, pero cuando ya está hecha no hace nada)
async function cleanup(guild, dry, log, fetched) {
  const byName = (n) => guild.roles.cache.find((r) => r.name === n);
  for (const [from, to] of Object.entries(data.CLEANUP.merge)) {
    const old = byName(from), target = byName(to);
    if (!old || !target || old.id === target.id) continue;
    if (!fetched.done) {
      await guild.members.fetch().catch(() => null);
      fetched.done = true;
    }
    const members = [...old.members.values()];
    log.push(`limpieza: ${from} -> ${to} (${members.length} miembro(s)) y borrar ${from}`);
    if (dry || !old.editable || !target.editable) continue;
    for (const m of members) if (!m.roles.cache.has(target.id)) await m.roles.add(target, "Limpieza: rol duplicado").catch((e) => log.push(`  error: ${e.message}`));
    await old.delete("Limpieza: rol duplicado").catch((e) => log.push(`  error: ${e.message}`));
  }
  for (const n of data.CLEANUP.remove) {
    const role = byName(n);
    if (!role) continue;
    log.push(`limpieza: borrar ${n}`);
    if (!dry && role.editable) await role.delete("Limpieza: rol duplicado").catch((e) => log.push(`  error: ${e.message}`));
  }
  for (const n of data.CLEANUP.noAdmin) {
    const role = byName(n);
    if (!role || !role.permissions.has(Discord.PermissionFlagsBits.Administrator)) continue;
    log.push(`limpieza: quitar Administrador a ${n}`);
    if (!dry && role.editable)
      await role
        .setPermissions(role.permissions.remove(Discord.PermissionFlagsBits.Administrator), "Limpieza: rol de pruebas sin Administrador")
        .catch((e) => log.push(`  error: ${e.message}`));
  }
  for (const [top, below] of data.CLEANUP.above) {
    const a = byName(top), b = byName(below);
    if (!a || !b || a.position > b.position) continue;
    log.push(`limpieza: poner ${top} por encima de ${below}`);
    if (!dry && a.editable && b.editable) await a.setPosition(b.position, { reason: "Limpieza: orden de roles" }).catch((e) => log.push(`  error: ${e.message}`));
  }
}

// Un rol por banda: lo crea, lo renombra o le cambia el color, y borra el de las bandas que ya no existen.
// Devuelve Map crew_id -> nombre del rol.
async function crewRoles(guild, dry, log) {
  const out = new Map();
  const list = await rangos.crews();
  const saved = new Map((await rangos.crewRoleIds(guild.id)).map((r) => [Number(r.crew_id), String(r.role_id)]));
  for (const c of list) {
    let role = saved.has(c.id) ? guild.roles.cache.get(saved.get(c.id)) : null;
    if (!role) role = guild.roles.cache.find((r) => r.name === c.name) || null;
    if (!role) {
      log.push(`crear rol de banda ${c.name}`);
      if (!dry) {
        role = await guild.roles.create({ name: c.name, color: c.color, reason: "Banda del juego" }).catch((e) => log.push(`  error: ${e.message}`) && null);
        if (role) await rangos.setCrewRole(guild.id, c.id, role.id);
      }
      out.set(c.id, c.name);
      continue;
    }
    if (saved.get(c.id) !== role.id && !dry) await rangos.setCrewRole(guild.id, c.id, role.id);
    if ((role.name !== c.name || role.hexColor.toLowerCase() !== c.color) && role.editable) {
      log.push(`actualizar rol de banda ${role.name} -> ${c.name} ${c.color}`);
      if (!dry) await role.edit({ name: c.name, color: c.color, reason: "Banda del juego" }).catch((e) => log.push(`  error: ${e.message}`));
    }
    out.set(c.id, dry ? c.name : role.name);
  }
  const alive = new Set(list.map((c) => c.id));
  for (const [crewId, roleId] of saved) {
    if (alive.has(crewId)) continue;
    const role = guild.roles.cache.get(roleId);
    log.push(`borrar rol de banda ${role?.name || roleId} (la banda ya no existe)`);
    if (dry) continue;
    if (role?.editable) await role.delete("La banda ya no existe").catch((e) => log.push(`  error: ${e.message}`));
    await rangos.setCrewRole(guild.id, crewId, null);
  }
  return out;
}

async function syncGuild(guild, dry) {
  const log = [];
  const fetched = { done: false };
  await cleanup(guild, dry, log, fetched);
  await ensureRoles(guild, dry, log);
  const crews = await crewRoles(guild, dry, log);
  const states = await rangos.linkedStates();
  if (!states.length) return log;
  if (!fetched.done) await guild.members.fetch().catch(() => null);
  const roleByName = (n) => guild.roles.cache.find((r) => r.name === n);

  for (const st of states) {
    const member = guild.members.cache.get(st.discordId);
    if (!member || member.user.bot) continue;
    const discordRefs = await invites.validInvites(guild.id, st.discordId).catch(() => 0);
    const p = rangos.plan(new Set(member.roles.cache.map((r) => r.name)), st, discordRefs, crews);
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
      if (mode === "on") {
        const n = await rangos.autoBadges();
        if (n) console.log(`[rangos] ${n} insignia(s) automática(s) nueva(s)`);
      }
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
