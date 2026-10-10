/*
 * Memoria de la IA: historial por usuario (Guild + User) guardado en la tabla bot_aimemory.
 * Usa el mismo ODM que el resto del bot (find, create, countDocuments, deleteMany...).
 */
const aiMemory = require("../../database/models/aiMemory");

const HISTORY_ROWS = parseInt(process.env.IA_HISTORIAL) || 16; // mensajes que se le pasan a la IA
const KEEP_ROWS = parseInt(process.env.IA_GUARDAR) || 40; // mensajes que se conservan por usuario
const MAX_CONTENT = 1500; // caracteres guardados por mensaje

// IDs de mensajes de la IA recientes (evita ir a la base de datos en cada respuesta)
const recentAiIds = new Set();
function rememberAiId(id) {
  recentAiIds.add(id);
  if (recentAiIds.size > 3000) recentAiIds.delete(recentAiIds.values().next().value);
}

/** ¿Este mensaje de Discord lo escribió la IA? (sobrevive a reinicios porque se busca en la tabla) */
async function isAiMessage(messageId) {
  if (recentAiIds.has(messageId)) return true;
  const row = await aiMemory.findOne({ messageId, Role: "assistant" }).lean().exec();
  if (row) rememberAiId(messageId);
  return !!row;
}

/** Últimos mensajes de la conversación con este usuario, del más viejo al más nuevo. */
async function getHistory(guildId, userId, limit = HISTORY_ROWS) {
  const rows = await aiMemory
    .find({ Guild: guildId, User: userId })
    .sort({ _id: -1 })
    .limit(limit)
    .lean()
    .exec();
  return rows.reverse().map((r) => ({ role: r.Role === "assistant" ? "assistant" : "user", content: r.Content }));
}

/** Guarda una fila del historial y recorta lo más viejo para que la tabla no crezca sin fin. */
async function addMessage({ guildId, userId, channelId, messageId, role, name, tag, content, provider }) {
  const text = String(content || "").slice(0, MAX_CONTENT);
  if (!text.trim()) return;
  await aiMemory.create({
    Guild: guildId,
    User: userId,
    Channel: channelId,
    messageId: messageId || "",
    Role: role,
    Name: name,
    Tag: tag,
    Content: text,
    Provider: provider || "",
    At: Date.now(),
  });
  if (role === "assistant" && messageId) rememberAiId(messageId);
}

async function trim(guildId, userId) {
  const total = await aiMemory.countDocuments({ Guild: guildId, User: userId }).exec();
  if (total <= KEEP_ROWS) return;
  const old = await aiMemory
    .find({ Guild: guildId, User: userId })
    .sort({ _id: 1 })
    .limit(total - KEEP_ROWS)
    .lean()
    .exec();
  if (old.length) await aiMemory.deleteMany({ _id: { $in: old.map((r) => r._id) } }).exec();
}

/** Borra todo el historial de un usuario (para un futuro comando de "olvidar"). */
async function clearUser(guildId, userId) {
  const res = await aiMemory.deleteMany({ Guild: guildId, User: userId }).exec();
  return res?.deletedCount ?? 0;
}

module.exports = { isAiMessage, getHistory, addMessage, trim, clearUser, rememberAiId };
