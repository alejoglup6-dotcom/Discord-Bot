/*
 * Consultas a las tablas del servidor de SA-MP (player, bans, bad_history, crews) y a las tablas
 * discord_* que comparten el bot y el gamemode (gamemodes/src/discord_link.pwn en el repo Backup).
 */
const crypto = require("crypto");
const db = require("./mysql");

// Igual que ADMIN_LEVELS y el enum TYPE_* de snrp.pwn
const ADMIN_LEVELS = ["Ciudadano", "Ayudante", "Moderador", "Operador", "Administrador", "Desarrollador"];
const HISTORY = { WARNING: 0, KICK: 1, BAN: 2, TEMP_BAN: 3, UNBAN: 4 };
// Rango mínimo de cada comando, igual que los flags: del gamemode (muteard, tban/unban, ban)
const REQUIRED_LEVEL = { mute: 1, unmute: 1, tempban: 3, unban: 3, ban: 4 };
const LINK_CODE_MINUTES = 10;

let available = null;

// Crea las tablas discord_* si la base de datos es la del servidor (tiene la tabla player)
async function init() {
  const rows = await db.query(
    "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'player'",
  );
  available = Number(rows[0].n) > 0;
  if (!available) return false;

  await db.query(`CREATE TABLE IF NOT EXISTS discord_links (
    player_id INT NOT NULL,
    discord_id VARCHAR(20) NOT NULL,
    linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id),
    UNIQUE KEY discord_id (discord_id),
    CONSTRAINT discord_links_player FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS discord_link_codes (
    code VARCHAR(8) NOT NULL,
    discord_id VARCHAR(20) NOT NULL,
    player_name VARCHAR(24) NOT NULL,
    expires_at DATETIME NOT NULL,
    PRIMARY KEY (code),
    UNIQUE KEY discord_id (discord_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS discord_actions (
    id INT NOT NULL AUTO_INCREMENT,
    player_id INT NOT NULL,
    action VARCHAR(16) NOT NULL,
    value INT NOT NULL DEFAULT 0,
    reason VARCHAR(128) NOT NULL DEFAULT '',
    by_name VARCHAR(24) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    done TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY pending (done)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  // Skin que lleva puesta ahora cada jugador conectado (la escribe el gamemode cada 5 segundos)
  await db.query(`CREATE TABLE IF NOT EXISTS discord_live (
    player_id INT NOT NULL,
    skin INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  return true;
}

async function isAvailable() {
  if (available === null) {
    try {
      await init();
    } catch {
      available = false;
    }
  }
  return available;
}

// ---------------------------------------------------------------------------------------------------------------
// Cuentas

const PLAYER_FIELDS = `p.id, p.name, p.ip, p.reg_date, p.last_connection, p.time_playing, p.level, p.rep,
  p.connected, p.playerid, p.admin_level, p.vip, p.vip_expire_date, p.coins, p.cash, p.bank_account, p.bank_money,
  p.phone_number, p.wanted_level, p.arrests_count, p.kills_count, p.mute, p.crew, c.name AS crew_name,
  p.skin, lv.skin AS live_skin`;
const PLAYER_JOINS = "LEFT JOIN crews c ON c.id = p.crew LEFT JOIN discord_live lv ON lv.player_id = p.id";

// Skin que se ve ahora: la que lleva puesta si está conectado (uniformes incluidos), si no la guardada en la cuenta
function currentSkin(player) {
  const live = Number(player.connected) && player.live_skin !== null && player.live_skin !== undefined;
  return { skin: Number(live ? player.live_skin : player.skin), live: Boolean(live) };
}

// Imagen de la skin. SAMP_SKIN_URL cambia la fuente ({skin} = número); las de open.mp van de 0 a 311.
function skinImage(skin) {
  const template = process.env.SAMP_SKIN_URL || "https://assets.open.mp/assets/images/skins/{skin}.png";
  if (!process.env.SAMP_SKIN_URL && (skin < 0 || skin > 311)) return null;
  return template.replace("{skin}", String(skin));
}

async function getPlayerByName(name) {
  const rows = await db.query(`SELECT ${PLAYER_FIELDS} FROM player p ${PLAYER_JOINS} WHERE p.name = ?`, [name]);
  return rows[0] || null;
}

async function getPlayerById(id) {
  const rows = await db.query(`SELECT ${PLAYER_FIELDS} FROM player p ${PLAYER_JOINS} WHERE p.id = ?`, [id]);
  return rows[0] || null;
}

async function getLinkedPlayer(discordId) {
  const rows = await db.query(
    `SELECT ${PLAYER_FIELDS}, l.linked_at FROM discord_links l JOIN player p ON p.id = l.player_id ${PLAYER_JOINS} WHERE l.discord_id = ?`,
    [discordId],
  );
  return rows[0] || null;
}

async function getLinkedDiscord(playerId) {
  const rows = await db.query("SELECT discord_id FROM discord_links WHERE player_id = ?", [playerId]);
  return rows[0]?.discord_id || null;
}

// Código que el jugador escribe en el juego con /vincular. Sin 0/O ni 1/I para que no se confundan.
async function createLinkCode(discordId, playerName) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join("");
    try {
      await db.query("DELETE FROM discord_link_codes WHERE discord_id = ? OR expires_at < NOW()", [discordId]);
      await db.query(
        "INSERT INTO discord_link_codes (code, discord_id, player_name, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))",
        [code, discordId, playerName, LINK_CODE_MINUTES],
      );
      return code;
    } catch (err) {
      if (err.code !== "ER_DUP_ENTRY") throw err;
    }
  }
  throw new Error("No se pudo generar un código");
}

async function unlink(discordId) {
  await db.query("DELETE FROM discord_link_codes WHERE discord_id = ?", [discordId]);
  const res = await db.query("DELETE FROM discord_links WHERE discord_id = ?", [discordId]);
  return res.affectedRows > 0;
}

async function getOnlinePlayers() {
  return db.query("SELECT name, level, playerid, admin_level FROM player WHERE connected = 1 ORDER BY playerid");
}

const TOPS = {
  level: { column: "p.level DESC, p.rep DESC", value: "p.level" },
  money: { column: "(p.cash + p.bank_money) DESC", value: "(p.cash + p.bank_money)" },
  hours: { column: "p.time_playing DESC", value: "p.time_playing" },
  kills: { column: "p.kills_count DESC", value: "p.kills_count" },
};

async function getTop(type, limit = 50) {
  const t = TOPS[type] || TOPS.level;
  return db.query(`SELECT p.name, ${t.value} AS value FROM player p ORDER BY ${t.column}, p.id LIMIT ?`, [limit]);
}

// Los que más dinero tienen en el juego (efectivo + banco), para la tabla de 💼┆millonarios
async function getRichest(limit = 15) {
  return db.query(
    `SELECT p.name, p.cash, p.bank_money, (p.cash + p.bank_money) AS total, p.connected, p.level
     FROM player p ORDER BY total DESC, p.id LIMIT ?`,
    [limit],
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Sanciones (hacen lo mismo que AddPlayerBan, /unban y /muteard del gamemode)

async function getActiveBan(player) {
  const rows = await db.query(
    `SELECT b.id, UNIX_TIMESTAMP(b.expire_date) AS expire_ts, h.text, h.date, a.name AS by_name
     FROM bans b LEFT JOIN bad_history h ON h.id = b.id_history LEFT JOIN player a ON a.id = h.by
     WHERE b.name = ? ORDER BY b.id DESC LIMIT 1`,
    [player.name],
  );
  const ban = rows[0];
  if (!ban) return null;
  const expires = Number(ban.expire_ts) || 0;
  if (expires && expires * 1000 <= Date.now()) return null;
  return { ...ban, expires };
}

async function addHistory(conn, playerId, byId, type, text) {
  const [res] = await conn.query("INSERT INTO bad_history (id_player, type, `by`, `text`, `date`) VALUES (?, ?, ?, ?, NOW())", [
    playerId,
    type,
    byId,
    text.slice(0, 128),
  ]);
  return res.insertId;
}

async function transaction(fn) {
  const conn = await db.getPool().getConnection();
  try {
    await conn.beginTransaction();
    const r = await fn(conn);
    await conn.commit();
    return r;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

// Acción para el gamemode: la aplica en el jugador conectado (lo expulsa o cambia su silencio en memoria)
async function queueAction(conn, playerId, action, value, reason, byName) {
  await conn.query("INSERT INTO discord_actions (player_id, action, value, reason, by_name) VALUES (?, ?, ?, ?, ?)", [
    playerId,
    action,
    value,
    (reason || "").slice(0, 128),
    (byName || "").slice(0, 24),
  ]);
}

async function ban(target, admin, reason, days = 0) {
  return transaction(async (conn) => {
    const historyId = await addHistory(conn, target.id, admin.id, days ? HISTORY.TEMP_BAN : HISTORY.BAN, reason);
    if (days) {
      await conn.query("INSERT INTO bans (name, ip, id_history, expire_date) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))", [
        target.name,
        target.ip.slice(0, 16),
        historyId,
        days,
      ]);
    } else {
      // Sin expire_date: queda el valor por defecto '0000-00-00 00:00:00' (permanente), igual que en el gamemode
      await conn.query("INSERT INTO bans (name, ip, id_history) VALUES (?, ?, ?)", [
        target.name,
        target.ip.slice(0, 16),
        historyId,
      ]);
    }
    const text = days ? `Has sido baneado por ${days} dias, razon:\n${reason}` : `Has sido baneado, razon:\n${reason}`;
    await queueAction(conn, target.id, "kick", 0, text, admin.name);
  });
}

async function unban(target, admin) {
  return transaction(async (conn) => {
    // Solo por nombre, como /unban <nombre> en el juego (por IP se desbanearían otras cuentas de esa IP)
    const [res] = await conn.query("DELETE FROM bans WHERE name = ?", [target.name]);
    if (!res.affectedRows) return false;
    await addHistory(conn, target.id, admin.id, HISTORY.UNBAN, "/unban (Discord)");
    return true;
  });
}

// mute = fin del silencio en tiempo unix (0 = sin silencio), como PI[pi_MUTE]
async function setMute(target, admin, minutes, reason) {
  return transaction(async (conn) => {
    const [[{ now }]] = await conn.query("SELECT UNIX_TIMESTAMP() AS now");
    const until = minutes > 0 ? Number(now) + minutes * 60 : 0;
    await conn.query("UPDATE player SET mute = ? WHERE id = ?", [until, target.id]);
    await queueAction(conn, target.id, minutes > 0 ? "mute" : "unmute", until, reason, admin.name);
    return until;
  });
}

async function isMuted(target) {
  const rows = await db.query("SELECT mute > UNIX_TIMESTAMP() AS muted FROM player WHERE id = ?", [target.id]);
  return Boolean(Number(rows[0]?.muted));
}

module.exports = {
  ADMIN_LEVELS,
  REQUIRED_LEVEL,
  LINK_CODE_MINUTES,
  init,
  isAvailable,
  currentSkin,
  skinImage,
  getPlayerByName,
  getPlayerById,
  getLinkedPlayer,
  getLinkedDiscord,
  createLinkCode,
  unlink,
  getOnlinePlayers,
  getTop,
  getRichest,
  getActiveBan,
  ban,
  unban,
  setMute,
  isMuted,
};
