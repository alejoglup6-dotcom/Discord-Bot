/*
 * Rangos unificados juego <-> Discord: qué rangos tiene cada cuenta vinculada (discord_links) según la base de datos
 * del servidor de SA-MP. Las mismas reglas que gamemodes/src/rangos.pwn (repo Backup); la lista está en
 * src/assets/data/rangos.js. Los rangos manuales se guardan en player_ranks (la comparten el juego y el bot).
 */
const db = require("./mysql");
const data = require("../assets/data/rangos");

async function init() {
  await db.query(`CREATE TABLE IF NOT EXISTS player_ranks (
    player_id INT NOT NULL,
    rank_key VARCHAR(32) NOT NULL,
    source VARCHAR(8) NOT NULL DEFAULT 'game',
    granted_by INT NOT NULL DEFAULT 0,
    granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    PRIMARY KEY (player_id, rank_key),
    KEY rank_key (rank_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  // la crea también el gamemode (sanciones.pwn); aquí por si el bot arranca antes
  await db.query(`CREATE TABLE IF NOT EXISTS player_status (
    player_id INT NOT NULL,
    platform VARCHAR(8) NOT NULL DEFAULT '',
    ooc_jail TINYINT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  // rol de Discord de cada banda (por servidor de Discord)
  await db.query(`CREATE TABLE IF NOT EXISTS discord_crew_roles (
    guild_id VARCHAR(20) NOT NULL,
    crew_id INT NOT NULL,
    role_id VARCHAR(20) NOT NULL,
    PRIMARY KEY (guild_id, crew_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// Insignias automáticas (ver DIAMANTE_COINS en src/assets/data/rangos.js). Se guardan como dadas en el juego, para
// todas las cuentas (vinculadas o no): el juego las muestra y el bot pone el rol. Devuelve cuántas se añadieron.
async function autoBadges(env = process.env) {
  let added = 0;
  const run = async (sql, params) => {
    const r = await safeQuery(sql, params);
    added += Number(r?.affectedRows || 0);
  };
  await run(
    `INSERT IGNORE INTO player_ranks (player_id, rank_key, source)
     SELECT DISTINCT player_id, 'insignia_donador', 'game' FROM tebex_commands WHERE status = 'delivered' AND player_id IS NOT NULL`,
  );
  const coins = parseInt(env.RANGOS_DIAMANTE_COINS) || data.DIAMANTE_COINS;
  await run(
    `INSERT IGNORE INTO player_ranks (player_id, rank_key, source)
     SELECT player_id, 'insignia_diamante', 'game' FROM tebex_commands
     WHERE status = 'delivered' AND action = 'coins' AND player_id IS NOT NULL GROUP BY player_id HAVING SUM(value) >= ?`,
    [coins],
  );
  const from = /^\d{4}-\d{2}-\d{2}$/.test(env.RANGOS_BETA_DESDE || "") ? env.RANGOS_BETA_DESDE : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(env.RANGOS_BETA_HASTA || "") ? env.RANGOS_BETA_HASTA : "9999-12-31";
  if (from)
    await run(
      `INSERT IGNORE INTO player_ranks (player_id, rank_key, source)
       SELECT id, 'insignia_betatester', 'game' FROM player WHERE reg_date >= ? AND reg_date < DATE_ADD(?, INTERVAL 1 DAY)`,
      [from, to],
    );
  return added;
}

// Bandas del juego: [{ id, name, color: "#rrggbb" }]. crews.color es RGBA con signo (como en SA-MP).
async function crews() {
  const rows = await safeQuery("SELECT id, name, color FROM crews");
  return rows.map((c) => ({
    id: Number(c.id),
    name: `${data.CREW_ROLE_PREFIX}${String(c.name).trim()}`.slice(0, 100),
    color: `#${((Number(c.color) >>> 8) & 0xffffff).toString(16).padStart(6, "0")}`,
  }));
}
async function crewRoleIds(guildId) {
  return safeQuery("SELECT crew_id, role_id FROM discord_crew_roles WHERE guild_id = ?", [guildId]);
}
async function setCrewRole(guildId, crewId, roleId) {
  if (roleId) await db.query("REPLACE INTO discord_crew_roles (guild_id, crew_id, role_id) VALUES (?, ?, ?)", [guildId, crewId, roleId]);
  else await db.query("DELETE FROM discord_crew_roles WHERE guild_id = ? AND crew_id = ?", [guildId, crewId]);
}

// Rangos automáticos de un jugador (claves "auto" de RANKS). p = fila de player; faction = { id_faction, level } o null;
// achievements = Set de ach_id; properties = cantidad de propiedades.
function computeAuto(p, faction, achievements = new Set(), properties = 0) {
  const keys = new Set();
  const staff = data.STAFF[Number(p.admin_level)];
  if (staff) keys.add(staff);
  if (faction && data.FACTIONS[Number(faction.id_faction)] && Number(faction.level) >= 1) {
    const key = `${data.FACTIONS[Number(faction.id_faction)]}_${Number(faction.level)}`;
    if (data.BY_KEY.has(key)) keys.add(key);
    else {
      // rango por encima del máximo: el más alto de la facción (como FactionMaxRank en el juego)
      const prefix = `${data.FACTIONS[Number(faction.id_faction)]}_`;
      const top = data.RANKS.find((r) => r.key.startsWith(prefix));
      if (top) keys.add(top.key);
    }
  }
  if (p.crew) keys.add(Number(p.crew_rank) === 0 ? "banda_lider" : "banda_miembro");
  for (let t = data.LEVEL_MIN.length - 1; t >= 0; t--) {
    if (Number(p.level) >= data.LEVEL_MIN[t]) {
      keys.add(`nivel_${t + 1}`);
      break;
    }
  }
  if (Number(p.bank_account) && Number(p.bank_money) >= 1000000) keys.add("eco_millonario");
  if (Number(properties) >= 1) keys.add("eco_empresario");
  for (const [id, key] of Object.entries(data.LOGRO_RANKS)) if (achievements.has(Number(id))) keys.add(key);
  return keys;
}

function vipState(p, now = new Date()) {
  const v = Number(p.vip);
  const exp = p.vip_expire_date ? new Date(String(p.vip_expire_date).replace(" ", "T")) : null;
  const active = v >= 2 && (!exp || isNaN(exp) || exp > now);
  return { vip: active, socio: active && v === 3 };
}

function refTier(total) {
  return data.REF_TIERS.find((t) => total >= t.min)?.key || null;
}

/*
 * Sincronización al momento: cada cambio que importa para los roles apunta la cuenta en discord_sync_queue (triggers
 * de la base de datos, así vale para el juego, /juego, la web o un UPDATE a mano) y el bot la recoge a los pocos
 * segundos. [tabla, columna del jugador, condición en UPDATE (null = cualquier cambio)]
 */
const QUEUE_SOURCES = [
  ["player", "id", "NOT (OLD.admin_level <=> NEW.admin_level AND OLD.level <=> NEW.level AND OLD.vip <=> NEW.vip AND OLD.vip_expire_date <=> NEW.vip_expire_date AND OLD.bank_account <=> NEW.bank_account AND OLD.bank_money <=> NEW.bank_money AND OLD.crew <=> NEW.crew AND OLD.crew_rank <=> NEW.crew_rank AND OLD.mute <=> NEW.mute AND OLD.name <=> NEW.name)"],
  ["pfactions", "id_player", null],
  ["player_ranks", "player_id", null],
  ["player_status", "player_id", null],
  ["bad_history", "id_player", null],
  ["discord_links", "player_id", null],
  ["pcharacter", "id_player", "NOT (OLD.country <=> NEW.country)"],
  ["player_achievements", "player_id", null],
  ["properties", "id_player", "NOT (OLD.id_player <=> NEW.id_player)"],
  ["referral_uses", "owner_id", null],
];

// Crea la cola y los triggers (se pueden volver a crear sin problema). { ok, error } si el usuario de MySQL no
// tiene permiso para triggers: entonces solo queda la vuelta completa.
async function initQueue() {
  await db.query(`CREATE TABLE IF NOT EXISTS discord_sync_queue (
    player_id INT NOT NULL,
    changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (player_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const tables = new Set(
    (await db.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()")).map((r) => r.t),
  );
  let made = 0;
  try {
    for (const [table, col, cond] of QUEUE_SOURCES) {
      if (!tables.has(table)) continue;
      for (const ev of ["INSERT", "UPDATE", "DELETE"]) {
        const row = ev === "DELETE" ? "OLD" : "NEW";
        const name = `bot_q_${table}_${ev.toLowerCase()}`.slice(0, 64);
        let body = `INSERT INTO discord_sync_queue (player_id) VALUES (${row}.${col}) ON DUPLICATE KEY UPDATE changed_at = CURRENT_TIMESTAMP(3)`;
        if (ev === "UPDATE") {
          // si cambia de dueño (propiedades, facción...), también el de antes
          body = `BEGIN IF ${cond || "TRUE"} THEN ${body}; IF NOT (OLD.${col} <=> NEW.${col}) THEN INSERT INTO discord_sync_queue (player_id) VALUES (OLD.${col}) ON DUPLICATE KEY UPDATE changed_at = CURRENT_TIMESTAMP(3); END IF; END IF; END`;
        } else if (table === "player") continue; // altas y bajas de cuentas: no hace falta
        await db.query(`DROP TRIGGER IF EXISTS ${name}`);
        await db.query(`CREATE TRIGGER ${name} AFTER ${ev} ON ${table} FOR EACH ROW ${body}`);
        made++;
      }
    }
    return { ok: true, triggers: made };
  } catch (e) {
    return { ok: false, error: e.code || e.message, triggers: made };
  }
}

// Cuentas que cambiaron desde la última vez (y las quita de la cola)
async function takeQueue(limit = 200) {
  const rows = await db.query("SELECT player_id, changed_at FROM discord_sync_queue ORDER BY changed_at LIMIT ?", [limit]);
  if (!rows.length) return [];
  // solo se borra si no volvió a cambiar mientras tanto
  for (const r of rows) await db.query("DELETE FROM discord_sync_queue WHERE player_id = ? AND changed_at = ?", [r.player_id, r.changed_at]);
  return rows.map((r) => Number(r.player_id)).filter((id) => id > 0);
}

async function safeQuery(sql, params) {
  try {
    return await db.query(sql, params);
  } catch {
    return []; // tabla que aún no existe (referral_uses, player_achievements...)
  }
}

// Estado de las cuentas vinculadas (todas, o solo las de onlyIds): [{ discordId, playerId, name, auto: Set, vip, socio, manual: Map(key -> source), gameRefs }]
async function linkedStates(onlyIds = null) {
  if (onlyIds && !onlyIds.length) return [];
  const players = await db.query(
    `SELECT dl.discord_id, p.id, p.name, p.admin_level, p.level, p.vip, p.vip_expire_date, p.bank_account, p.bank_money, p.crew, p.crew_rank,
       p.mute > UNIX_TIMESTAMP() AS muted
     FROM discord_links dl JOIN player p ON p.id = dl.player_id${onlyIds ? " WHERE p.id IN (?)" : ""}`,
    onlyIds ? [onlyIds] : [],
  );
  if (!players.length) return [];
  const ids = players.map((p) => p.id);
  const [factions, achs, props, refs, manual, status, warns, countries] = await Promise.all([
    safeQuery("SELECT id_player, id_faction, level FROM pfactions WHERE id_player IN (?)", [ids]),
    safeQuery(`SELECT player_id, ach_id FROM player_achievements WHERE player_id IN (?) AND ach_id IN (?)`, [ids, Object.keys(data.LOGRO_RANKS).map(Number)]),
    safeQuery("SELECT id_player, COUNT(*) AS n FROM properties WHERE id_player IN (?) GROUP BY id_player", [ids]),
    safeQuery("SELECT owner_id, COUNT(*) AS n FROM referral_uses WHERE owner_id IN (?) AND paid = 1 GROUP BY owner_id", [ids]),
    safeQuery("SELECT player_id, rank_key, source FROM player_ranks WHERE player_id IN (?) AND (expires_at IS NULL OR expires_at > NOW())", [ids]),
    safeQuery("SELECT player_id, platform, ooc_jail FROM player_status WHERE player_id IN (?)", [ids]),
    safeQuery("SELECT id_player, COUNT(*) AS n FROM bad_history WHERE id_player IN (?) AND type = 0 AND date > DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY id_player", [
      ids,
      data.WARN_DAYS,
    ]),
    safeQuery("SELECT id_player, country FROM pcharacter WHERE id_player IN (?)", [ids]),
  ]);
  const by = (rows, col) => {
    const m = new Map();
    for (const r of rows) {
      const k = String(r[col]);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return m;
  };
  const F = by(factions, "id_player"), A = by(achs, "player_id"), P = by(props, "id_player"), R = by(refs, "owner_id"), M = by(manual, "player_id");
  const S = by(status, "player_id"), W = by(warns, "id_player"), C = by(countries, "id_player");
  return players.map((p) => {
    const id = String(p.id);
    const faction = (F.get(id) || [])[0] || null;
    const ach = new Set((A.get(id) || []).map((r) => Number(r.ach_id)));
    const v = vipState(p);
    const st = (S.get(id) || [])[0] || {};
    return {
      discordId: String(p.discord_id),
      playerId: Number(p.id),
      name: p.name,
      auto: computeAuto(p, faction, ach, Number((P.get(id) || [])[0]?.n || 0)),
      vip: v.vip,
      socio: v.socio,
      manual: new Map((M.get(id) || []).map((r) => [r.rank_key, r.source])),
      gameRefs: Number((R.get(id) || [])[0]?.n || 0),
      muted: Boolean(Number(p.muted)),
      oocJail: Boolean(Number(st.ooc_jail)),
      warnings: Number((W.get(id) || [])[0]?.n || 0),
      platform: data.PLATFORM_ROLES[st.platform] ? st.platform : null,
      country: data.COUNTRY_ROLES[(C.get(id) || [])[0]?.country] ? (C.get(id) || [])[0].country : null,
      crewId: p.crew ? Number(p.crew) : null,
    };
  });
}

/*
 * Qué hay que hacer con un miembro. memberRoles = Set de nombres de sus roles; state = de linkedStates();
 * discordRefs = invitados válidos en Discord; crewRoles = Map crew_id -> nombre del rol de cada banda.
 * Devuelve { add, remove, saveManual, deleteManual, refKey }.
 */
function plan(memberRoles, state, discordRefs = 0, crewRoles = new Map()) {
  const want = new Set(), managed = new Set([data.VIP_ROLE, data.SOCIO_ROLE]);
  for (const r of data.RANKS) {
    if (r.mode !== "auto") continue;
    managed.add(r.role);
    if (r.group) managed.add(r.group);
    if (state.auto.has(r.key)) {
      want.add(r.role);
      if (r.group) want.add(r.group);
    }
  }
  // el rol de facción se gestiona solo si la facción existe en el juego (el de una facción "pending" no se toca)
  for (const r of data.RANKS) if (r.mode === "pending" && r.group) managed.delete(r.group);
  if (state.vip) want.add(data.VIP_ROLE);
  if (state.socio) want.add(data.SOCIO_ROLE);

  // sanciones: el juego manda siempre
  const sr = data.SANCTION_ROLES;
  for (const n of [sr.muted, sr.oocJail, ...sr.warnings]) managed.add(n);
  if (state.muted) want.add(sr.muted);
  if (state.oocJail) want.add(sr.oocJail);
  if (state.warnings > 0) want.add(sr.warnings[Math.min(state.warnings, sr.warnings.length) - 1]);
  // plataforma y país: solo si el juego tiene el dato (si no, se queda lo que eligió en Discord)
  if (state.platform) {
    for (const n of Object.values(data.PLATFORM_ROLES)) managed.add(n);
    want.add(data.PLATFORM_ROLES[state.platform]);
  }
  if (state.country) {
    for (const n of Object.values(data.COUNTRY_ROLES)) managed.add(n);
    want.add(data.COUNTRY_ROLES[state.country]);
  }
  // rol de su banda
  for (const n of crewRoles.values()) managed.add(n);
  if (state.crewId && crewRoles.has(state.crewId)) want.add(crewRoles.get(state.crewId));

  const add = new Set([...want].filter((n) => !memberRoles.has(n)));
  const remove = new Set([...managed].filter((n) => memberRoles.has(n) && !want.has(n)));
  add.add(data.LINKED_ROLE); // vinculado: solo se agrega

  // manuales: el que se da en un lado aparece en el otro
  const saveManual = [], deleteManual = [];
  for (const r of data.RANKS) {
    if (r.mode !== "manual") continue;
    const has = memberRoles.has(r.role), source = state.manual.get(r.key);
    if (has && !source) saveManual.push(r.key);
    else if (!has && source === "game") add.add(r.role);
    else if (!has && source === "discord") deleteManual.push(r.key);
  }

  // escalón de invitados: invitaciones de Discord + referidos del juego (solo se agrega)
  const refKey = refTier(state.gameRefs + Number(discordRefs || 0));
  if (refKey) add.add(data.BY_KEY.get(refKey).role);

  for (const n of memberRoles) add.delete(n);
  return { add: [...add], remove: [...remove], saveManual, deleteManual, refKey };
}

async function saveManual(playerId, key) {
  await db.query("INSERT IGNORE INTO player_ranks (player_id, rank_key, source) VALUES (?, ?, 'discord')", [playerId, key]);
}
async function deleteManual(playerId, key) {
  await db.query("DELETE FROM player_ranks WHERE player_id = ? AND rank_key = ? AND source = 'discord'", [playerId, key]);
}
// Deja solo el escalón de invitados indicado (lo lee el juego para /rango y el chat)
async function setRefTier(playerId, key) {
  const refs = data.REF_TIERS.map((t) => t.key).filter((k) => k !== key);
  await db.query("DELETE FROM player_ranks WHERE player_id = ? AND rank_key IN (?)", [playerId, refs]);
  if (key) await db.query("INSERT IGNORE INTO player_ranks (player_id, rank_key, source) VALUES (?, ?, 'discord')", [playerId, key]);
}

module.exports = {
  initQueue,
  takeQueue,
  QUEUE_SOURCES,
  init,
  computeAuto,
  vipState,
  refTier,
  linkedStates,
  plan,
  saveManual,
  deleteManual,
  setRefTier,
  autoBadges,
  crews,
  crewRoleIds,
  setCrewRole,
};
