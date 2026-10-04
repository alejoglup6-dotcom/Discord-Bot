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

async function safeQuery(sql, params) {
  try {
    return await db.query(sql, params);
  } catch {
    return []; // tabla que aún no existe (referral_uses, player_achievements...)
  }
}

// Estado de todas las cuentas vinculadas: [{ discordId, playerId, name, auto: Set, vip, socio, manual: Map(key -> source), gameRefs }]
async function linkedStates() {
  const players = await db.query(
    `SELECT dl.discord_id, p.id, p.name, p.admin_level, p.level, p.vip, p.vip_expire_date, p.bank_account, p.bank_money, p.crew, p.crew_rank
     FROM discord_links dl JOIN player p ON p.id = dl.player_id`,
  );
  if (!players.length) return [];
  const ids = players.map((p) => p.id);
  const [factions, achs, props, refs, manual] = await Promise.all([
    safeQuery("SELECT id_player, id_faction, level FROM pfactions WHERE id_player IN (?)", [ids]),
    safeQuery(`SELECT player_id, ach_id FROM player_achievements WHERE player_id IN (?) AND ach_id IN (?)`, [ids, Object.keys(data.LOGRO_RANKS).map(Number)]),
    safeQuery("SELECT id_player, COUNT(*) AS n FROM properties WHERE id_player IN (?) GROUP BY id_player", [ids]),
    safeQuery("SELECT owner_id, COUNT(*) AS n FROM referral_uses WHERE owner_id IN (?) AND paid = 1 GROUP BY owner_id", [ids]),
    safeQuery("SELECT player_id, rank_key, source FROM player_ranks WHERE player_id IN (?) AND (expires_at IS NULL OR expires_at > NOW())", [ids]),
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
  return players.map((p) => {
    const id = String(p.id);
    const faction = (F.get(id) || [])[0] || null;
    const ach = new Set((A.get(id) || []).map((r) => Number(r.ach_id)));
    const v = vipState(p);
    return {
      discordId: String(p.discord_id),
      playerId: Number(p.id),
      name: p.name,
      auto: computeAuto(p, faction, ach, Number((P.get(id) || [])[0]?.n || 0)),
      vip: v.vip,
      socio: v.socio,
      manual: new Map((M.get(id) || []).map((r) => [r.rank_key, r.source])),
      gameRefs: Number((R.get(id) || [])[0]?.n || 0),
    };
  });
}

/*
 * Qué hay que hacer con un miembro. memberRoles = Set de nombres de sus roles; state = de linkedStates();
 * discordRefs = invitados válidos en Discord. Devuelve { add, remove, saveManual, deleteManual, refKey }.
 */
function plan(memberRoles, state, discordRefs = 0) {
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

module.exports = { init, computeAuto, vipState, refTier, linkedStates, plan, saveManual, deleteManual, setRefTier };
