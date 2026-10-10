/*
 * Correcciones del staff y huecos de conocimiento de la IA (Fase 1 del plan).
 *
 *  - Correcciones: /ia corregir <pregunta> <respuesta>. Se guardan en bot_aicorrections y getKnowledge() las pone
 *    primero (sobre la guía) cuando la pregunta de alguien se parece a la pregunta corregida.
 *  - Huecos: cuando no hay nada relevante en la guía/comandos/correcciones, la pregunta se anota en bot_aigaps
 *    (con contador). También se anotan las respuestas con 👎.
 */
const Corrections = require("../../database/models/aiCorrections");
const Gaps = require("../../database/models/aiGaps");

const STOP = new Set(
  "para como que con por los las del una uno unos unas este esta esto estos estas hay mas muy pero sus tus mis donde cuando quien cual cuales puedo puede pueden quiero quieres dime dame necesito tengo tiene tienen hacer hago veo ver sobre desde hasta entre algo alguien todo todos bot hola gracias favor".split(" "),
);
// Palabras cortas sin significado (las de 2 letras como "ip" sí cuentan)
const SHORT_STOP = new Set("es el la de en un lo me mi tu su se al ya no si le y o a e u oye ok".split(" "));
const TTL = 60 * 1000;
const cache = new Map(); // guildId -> { at, rows }

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim();

/** Raíces de 4 letras para que "comandos" encaje con "comando" y "server" con "servidor". */
function stems(text) {
  const out = new Set();
  for (const w of norm(text).split(" ")) {
    if (w.length < 2 || STOP.has(w) || SHORT_STOP.has(w)) continue;
    out.add(w.slice(0, 4));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Correcciones

async function list(guildId) {
  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < TTL) return hit.rows;
  const rows = await Corrections.find({ Guild: guildId }).sort({ Num: 1 }).lean().exec();
  cache.set(guildId, { at: Date.now(), rows });
  return rows;
}

async function add(guildId, { question, answer, by, byName }) {
  const rows = await Corrections.find({ Guild: guildId }).lean().exec();
  const Num = rows.reduce((m, r) => Math.max(m, r.Num || 0), 0) + 1;
  await Corrections.create({
    Guild: guildId,
    Num,
    Question: String(question).slice(0, 300),
    Answer: String(answer).slice(0, 1200),
    By: by,
    ByName: byName,
    At: Date.now(),
  });
  cache.delete(guildId);
  // si esta pregunta estaba en la lista de huecos, ya está resuelta
  await Gaps.deleteMany({ Guild: guildId, Key: gapKey(question) }).exec().catch(() => {});
  return Num;
}

async function remove(guildId, num) {
  const res = await Corrections.deleteMany({ Guild: guildId, Num: num }).exec();
  cache.delete(guildId);
  return res?.deletedCount ?? 0;
}

/**
 * Correcciones que tienen que ver con la pregunta (máx. 3), ordenadas por parecido.
 * Coincide si comparten al menos la mitad de las palabras clave de la pregunta corregida (mínimo 1).
 */
async function match(guildId, question) {
  const rows = await list(guildId).catch(() => []);
  if (!rows.length) return [];
  const q = stems(question);
  if (!q.size) return [];
  const scored = [];
  for (const r of rows) {
    const s = stems(r.Question);
    if (!s.size) continue;
    let shared = 0;
    for (const w of s) if (q.has(w)) shared++;
    const ratio = shared / s.size;
    if (shared >= Math.min(2, s.size) && ratio >= 0.5) scored.push({ r, ratio });
  }
  scored.sort((a, b) => b.ratio - a.ratio);
  return scored.slice(0, 3).map((x) => x.r);
}

/** Bloque de texto para <conocimiento> (o "" si no hay correcciones relacionadas). */
async function knowledgeBlock(guildId, question) {
  const hits = await match(guildId, question);
  if (!hits.length) return { text: "", count: 0 };
  const body = hits.map((r) => `- Pregunta: ${r.Question}\n  Respuesta correcta: ${r.Answer}`).join("\n");
  return {
    count: hits.length,
    text: `CORRECCIONES DEL STAFF (máxima prioridad: si contradicen la guía o cualquier otra cosa, mandan estas respuestas):\n${body}`,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Huecos

const gapKey = (q) => [...stems(q)].sort().join(" ").slice(0, 190);

/** ¿Parece una pregunta/petición real sobre algo (y no un saludo o charla)? */
function looksLikeQuestion(text) {
  const t = norm(text);
  if (t.length < 12 || stems(text).size < 2) return false;
  return /\?|^(como|donde|cuando|que|cual|cuales|cuanto|quien|puedo|se puede|hay|existe|necesito|quiero|ayuda)/.test(String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^[¿\s]+/, ""));
}

async function recordGap(guildId, { question, answer = "", sources = "", kind = "sin-info" }) {
  const Key = gapKey(question);
  if (!Key) return;
  const now = Date.now();
  const existing = await Gaps.findOne({ Guild: guildId, Key, Kind: kind }).exec();
  if (existing) {
    existing.Count = (existing.Count || 1) + 1;
    existing.At = now;
    existing.Question = String(question).slice(0, 300);
    if (answer) existing.Answer = String(answer).slice(0, 1200);
    if (sources) existing.Sources = String(sources).slice(0, 300);
    await existing.save();
    return;
  }
  await Gaps.create({
    Guild: guildId,
    Key,
    Question: String(question).slice(0, 300),
    Answer: String(answer).slice(0, 1200),
    Sources: String(sources).slice(0, 300),
    Kind: kind,
    Count: 1,
    First: now,
    At: now,
  });
}

async function topGaps(guildId, limit = 10) {
  const rows = await Gaps.find({ Guild: guildId }).lean().exec();
  return rows.sort((a, b) => (b.Count || 0) - (a.Count || 0) || (b.At || 0) - (a.At || 0)).slice(0, limit);
}

async function clearGaps(guildId) {
  const res = await Gaps.deleteMany({ Guild: guildId }).exec();
  return res?.deletedCount ?? 0;
}

module.exports = { list, add, remove, match, knowledgeBlock, recordGap, topGaps, clearGaps, looksLikeQuestion, _internals: { stems, gapKey } };
