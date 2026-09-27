/*
 * Copias de seguridad del servidor de Discord, guardadas en MySQL (la misma base del bot y del juego, que está fuera
 * de Discord: si alguien destruye el servidor, las copias siguen a salvo).
 *
 * Para que no pesen, se guardan en tres tablas:
 *  - bot_backups: una fila por copia con la ESTRUCTURA del servidor (ajustes, íconos, roles, canales y permisos,
 *    emojis, stickers, miembros con sus roles, baneos, automod, onboarding...) en JSON comprimido con gzip.
 *    Pesa unos KB. Se guardan las últimas copias automáticas (BACKUP_KEEP, 30 = 15 días) y las últimas manuales.
 *  - bot_backup_messages: los MENSAJES, una fila por mensaje, comprimida. Es incremental: cada copia solo agrega
 *    los mensajes nuevos, así que no se guarda dos veces lo mismo. Los mensajes borrados en Discord se quedan aquí.
 *  - bot_backup_files: los ARCHIVOS adjuntos (imágenes, etc.) de hasta BACKUP_MAX_FILE_MB (8 MB por defecto),
 *    una sola vez por archivo. Los enlaces de Discord caducan, por eso se descarga el archivo.
 */
const zlib = require("zlib");
const db = require("./mysql");

const KEEP_AUTO = () => parseInt(process.env.BACKUP_KEEP) || 30;
const KEEP_MANUAL = 20;

const pack = (obj) => zlib.gzipSync(Buffer.from(JSON.stringify(obj)), { level: 9 });
const unpack = (buf) => JSON.parse(zlib.gunzipSync(buf).toString("utf8"));
// Las fechas se guardan en UTC ("YYYY-MM-DD HH:MM:SS") y se leen igual
const utc = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");
const fromUtc = (s) => (s ? new Date(String(s).replace(" ", "T") + "Z") : null);

async function init() {
  await db.query(`CREATE TABLE IF NOT EXISTS bot_backups (
    id INT NOT NULL AUTO_INCREMENT,
    guild_id VARCHAR(20) NOT NULL,
    kind VARCHAR(8) NOT NULL,
    created_by VARCHAR(20) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stats TEXT NOT NULL,
    size_bytes INT NOT NULL DEFAULT 0,
    data LONGBLOB NOT NULL,
    PRIMARY KEY (id),
    KEY guild (guild_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS bot_backup_messages (
    message_id BIGINT UNSIGNED NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL,
    author_id VARCHAR(20) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL,
    data MEDIUMBLOB NOT NULL,
    PRIMARY KEY (message_id),
    KEY channel (channel_id, message_id),
    KEY guild (guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS bot_backup_files (
    attachment_id BIGINT UNSIGNED NOT NULL,
    message_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL DEFAULT '',
    size INT NOT NULL DEFAULT 0,
    data LONGBLOB NOT NULL,
    PRIMARY KEY (attachment_id),
    KEY message (message_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// ---------------------------------------------------------------- estructura

async function saveSnapshot(guildId, kind, createdBy, snapshot) {
  const data = pack(snapshot);
  const res = await db.query("INSERT INTO bot_backups (guild_id, kind, created_by, created_at, stats, size_bytes, data) VALUES (?, ?, ?, UTC_TIMESTAMP(), ?, ?, ?)", [
    guildId,
    kind,
    createdBy || "",
    JSON.stringify(snapshot.stats || {}),
    data.length,
    data,
  ]);
  // Limpieza: se quedan las últimas N automáticas y las últimas manuales
  for (const [k, keep] of [["auto", KEEP_AUTO()], ["manual", KEEP_MANUAL]]) {
    const old = await db.query("SELECT id FROM bot_backups WHERE guild_id = ? AND kind = ? ORDER BY id DESC LIMIT 18446744073709551615 OFFSET ?", [guildId, k, keep]);
    if (old.length) await db.query("DELETE FROM bot_backups WHERE id IN (?)", [old.map((r) => r.id)]);
  }
  return { id: Number(res.insertId), size: data.length };
}

async function listBackups(guildId, limit = 15) {
  const rows = await db.query(
    "SELECT id, kind, created_by, created_at, stats, size_bytes FROM bot_backups WHERE guild_id = ? ORDER BY id DESC LIMIT ?",
    [guildId, limit],
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), created_at: fromUtc(r.created_at), size_bytes: Number(r.size_bytes), stats: JSON.parse(r.stats || "{}") }));
}

async function getBackup(guildId, id) {
  const rows = id
    ? await db.query("SELECT * FROM bot_backups WHERE guild_id = ? AND id = ?", [guildId, id])
    : await db.query("SELECT * FROM bot_backups WHERE guild_id = ? ORDER BY id DESC LIMIT 1", [guildId]);
  if (!rows[0]) return null;
  const r = rows[0];
  return { id: Number(r.id), kind: r.kind, created_at: fromUtc(r.created_at), created_by: r.created_by, raw: r.data, snapshot: unpack(r.data) };
}

async function lastBackupDate(guildId, kind) {
  const rows = await db.query("SELECT MAX(created_at) AS last FROM bot_backups WHERE guild_id = ? AND kind = ?", [guildId, kind]);
  return fromUtc(rows[0]?.last);
}

// ---------------------------------------------------------------- mensajes

// Último mensaje guardado de cada canal (para seguir desde ahí)
async function lastMessageIds(guildId) {
  const rows = await db.query("SELECT channel_id, MAX(message_id) AS last FROM bot_backup_messages WHERE guild_id = ? GROUP BY channel_id", [guildId]);
  return new Map(rows.map((r) => [r.channel_id, String(r.last)]));
}

// Lo que se guarda de cada mensaje (lo necesario para verlo y volver a publicarlo)
function messageRecord(m) {
  return {
    id: m.id,
    channel_id: m.channel_id,
    type: m.type,
    content: m.content || "",
    author: { id: m.author?.id, username: m.author?.username, global_name: m.author?.global_name || null, avatar: m.author?.avatar || null, bot: Boolean(m.author?.bot) },
    timestamp: m.timestamp,
    edited_timestamp: m.edited_timestamp || null,
    pinned: Boolean(m.pinned),
    embeds: (m.embeds || []).filter((e) => e.type === "rich"),
    attachments: (m.attachments || []).map((a) => ({ id: a.id, filename: a.filename, size: a.size, content_type: a.content_type || "", description: a.description || null })),
    stickers: (m.sticker_items || []).map((s) => ({ id: s.id, name: s.name })),
    reference: m.message_reference?.message_id || null,
    thread_id: m.thread?.id || null,
  };
}

async function saveMessages(guildId, messages) {
  if (!messages.length) return 0;
  const rows = messages.map((m) => [m.id, guildId, m.channel_id, m.author?.id || "", utc(m.timestamp), pack(messageRecord(m))]);
  const res = await db.query("INSERT IGNORE INTO bot_backup_messages (message_id, guild_id, channel_id, author_id, created_at, data) VALUES ?", [rows]);
  return res.affectedRows || 0;
}

async function saveFile(attachmentId, messageId, name, contentType, data) {
  const res = await db.query("INSERT IGNORE INTO bot_backup_files (attachment_id, message_id, name, content_type, size, data) VALUES (?, ?, ?, ?, ?, ?)", [
    attachmentId,
    messageId,
    String(name).slice(0, 255),
    String(contentType || "").slice(0, 100),
    data.length,
    data,
  ]);
  return res.affectedRows > 0;
}

async function hasFile(attachmentId) {
  return (await db.query("SELECT 1 FROM bot_backup_files WHERE attachment_id = ?", [attachmentId])).length > 0;
}

async function channelMessages(channelId) {
  const rows = await db.query("SELECT data FROM bot_backup_messages WHERE channel_id = ? ORDER BY message_id", [channelId]);
  return rows.map((r) => unpack(r.data));
}

async function getFile(attachmentId) {
  const rows = await db.query("SELECT name, content_type, data FROM bot_backup_files WHERE attachment_id = ?", [attachmentId]);
  return rows[0] || null;
}

// Totales para /backup info
async function totals(guildId) {
  const [m] = await db.query("SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(data)),0) AS bytes, COUNT(DISTINCT channel_id) AS channels FROM bot_backup_messages WHERE guild_id = ?", [guildId]);
  const [f] = await db.query(
    "SELECT COUNT(*) AS n, COALESCE(SUM(f.size),0) AS bytes FROM bot_backup_files f JOIN bot_backup_messages m ON m.message_id = f.message_id WHERE m.guild_id = ?",
    [guildId],
  );
  const [b] = await db.query("SELECT COUNT(*) AS n, COALESCE(SUM(size_bytes),0) AS bytes FROM bot_backups WHERE guild_id = ?", [guildId]);
  return {
    messages: Number(m.n),
    messageBytes: Number(m.bytes),
    channels: Number(m.channels),
    files: Number(f.n),
    fileBytes: Number(f.bytes),
    backups: Number(b.n),
    backupBytes: Number(b.bytes),
  };
}

module.exports = {
  init,
  pack,
  unpack,
  saveSnapshot,
  listBackups,
  getBackup,
  lastBackupDate,
  lastMessageIds,
  messageRecord,
  saveMessages,
  saveFile,
  hasFile,
  channelMessages,
  getFile,
  totals,
};
