/*
 * Whitelist del servidor de SA-MP por nombre de cuenta (tablas whitelist y whitelist_config, las mismas que
 * gamemodes/src/whitelist.pwn del repo Backup). El gamemode las lee en cada conexión, así que lo que se cambia
 * desde Discord vale al momento.
 */
const db = require("./mysql");

const DEFAULT_MESSAGE =
  "SampCity esta en FASE BETA cerrada: por ahora solo pueden entrar los beta testers.|Postulate en nuestro Discord: discord.gg/QU7YWerPfV (canal de postulaciones).";
// Mismos caracteres que admite SA-MP en un nombre, de 3 a 24
const NAME = /^[A-Za-z0-9_[\].$()=@]{3,24}$/;

async function init() {
  await db.query(`CREATE TABLE IF NOT EXISTS whitelist (
    name VARCHAR(24) NOT NULL,
    added_by VARCHAR(32) NOT NULL DEFAULT '',
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS whitelist_config (
    id TINYINT NOT NULL,
    enabled TINYINT NOT NULL DEFAULT 0,
    message VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(32) NOT NULL DEFAULT '',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query("INSERT IGNORE INTO whitelist_config (id, enabled, message) VALUES (1, 0, ?)", [DEFAULT_MESSAGE]);
}

// "Juan_Perez, Ana_Gomez Luis_Diaz" -> nombres válidos y los que no lo son
function parseNames(text) {
  const all = [...new Set(String(text || "").split(/[\s,;]+/).filter(Boolean))];
  return { valid: all.filter((n) => NAME.test(n)), invalid: all.filter((n) => !NAME.test(n)) };
}

async function getConfig() {
  await init();
  const [c] = await db.query("SELECT enabled, message, updated_by, updated_at FROM whitelist_config WHERE id = 1");
  const [{ n }] = await db.query("SELECT COUNT(*) AS n FROM whitelist");
  return { enabled: Boolean(Number(c.enabled)), message: c.message || DEFAULT_MESSAGE, updatedBy: c.updated_by, updatedAt: c.updated_at, total: Number(n) };
}

async function setEnabled(enabled, by) {
  await init();
  await db.query("UPDATE whitelist_config SET enabled = ?, updated_by = ?, updated_at = NOW() WHERE id = 1", [enabled ? 1 : 0, String(by).slice(0, 32)]);
}

async function setMessage(message, by) {
  await init();
  await db.query("UPDATE whitelist_config SET message = ?, updated_by = ?, updated_at = NOW() WHERE id = 1", [String(message).slice(0, 255), String(by).slice(0, 32)]);
}

/** Agrega nombres. Devuelve { added: [...], already: [...] } */
async function add(names, by) {
  await init();
  const added = [], already = [];
  for (const name of names) {
    const res = await db.query("INSERT IGNORE INTO whitelist (name, added_by) VALUES (?, ?)", [name, String(by).slice(0, 32)]);
    (res.affectedRows ? added : already).push(name);
  }
  return { added, already };
}

async function remove(name) {
  await init();
  const res = await db.query("DELETE FROM whitelist WHERE name = ?", [name]);
  return res.affectedRows > 0;
}

async function has(name) {
  await init();
  return (await db.query("SELECT 1 FROM whitelist WHERE name = ?", [name])).length > 0;
}

async function list(limit = 200) {
  await init();
  return db.query("SELECT name, added_by, added_at FROM whitelist ORDER BY added_at DESC, name LIMIT ?", [limit]);
}

module.exports = { init, parseNames, getConfig, setEnabled, setMessage, add, remove, has, list, DEFAULT_MESSAGE, NAME };
