/*
 * Búsqueda semántica de la guía (Fase 1, punto 7 del plan). Complementa —no reemplaza— la búsqueda por palabras de iaGuia.js:
 * entiende que "plata" es "dinero" o que "hacerme policía" va con facciones, sin depender de la lista de sinónimos.
 *
 * Usa los embeddings gratis de Gemini (GEMINI_KEY, la misma del chat). Las secciones se vectorizan una sola vez y se guardan en
 * la carpeta .cache/ del bot (solo se recalculan las que cambian). Cada pregunta gasta 1 llamada (con caché).
 * Si Gemini falla o no hay key, todo sigue funcionando con la búsqueda por palabras de siempre.
 *
 * .env:  IA_EMBEDDINGS=0 la apaga.  IA_EMBED_MODEL (por defecto gemini-embedding-001).  IA_EMBED_DIM (256).
 *        IA_EMBED_RPM (secciones por minuto al indexar; 60 por defecto, baja a 30 si sigue dando 429).
 *        IA_EMBED_MIN (similitud mínima para considerar algo relevante; 0.60 por defecto, súbela si trae cosas que no tocan).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const CACHE_FILE = process.env.IA_EMBED_CACHE || path.join(process.cwd(), ".cache", "ia-embeddings.json"); // fuera de src/: escribirlo ahí reiniciaría el bot si usas nodemon o pm2 --watch
const RPM = () => parseInt(process.env.IA_EMBED_RPM, 10) || 60; // el plan gratis cuenta cada sección como una petición (~100/min)
const BATCH = 20;
const RETRY_MS = 5 * 60 * 1000;
const eligible = (s) => s.kind !== "lugar"; // los lugares (cajeros, locales, alquileres) son casi iguales entre sí y se buscan por nombre

const model = () => process.env.IA_EMBED_MODEL || "gemini-embedding-001";
const dim = () => parseInt(process.env.IA_EMBED_DIM, 10) || 256;
const minSim = () => (Number.isFinite(parseFloat(process.env.IA_EMBED_MIN)) ? parseFloat(process.env.IA_EMBED_MIN) : 0.6);
const enabled = () => !/^(0|false|no|off)$/i.test(String(process.env.IA_EMBEDDINGS ?? "1").trim()) && !!process.env.GEMINI_KEY;

const vecs = new Map(); // hash de la sección -> Float32Array normalizado
const qCache = new Map(); // pregunta -> Float32Array
let inflight = null;
let failedAt = 0;
let lastError = "";
let loadedDisk = false;

const hashOf = (s) => crypto.createHash("md5").update(`${model()}|${dim()}|${s.title}\n${s.body}`).digest("hex").slice(0, 16);
const textOf = (s) => `${s.title}\n${s.body}`.slice(0, 1200);

function normalize(arr) {
  let n = 0;
  for (const x of arr) n += x * x;
  n = Math.sqrt(n) || 1;
  return Float32Array.from(arr, (x) => x / n); // al recortar dimensiones hay que renormalizar
}

function loadDisk() {
  if (loadedDisk) return;
  loadedDisk = true;
  try {
    const j = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    if (j.model !== model() || j.dim !== dim()) return;
    for (const [h, v] of Object.entries(j.vecs || {})) vecs.set(h, Float32Array.from(v));
  } catch {}
}

function saveDisk(valid) {
  try {
    const out = {};
    for (const h of valid) if (vecs.has(h)) out[h] = Array.from(vecs.get(h), (x) => Math.round(x * 1e4) / 1e4);
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ model: model(), dim: dim(), vecs: out }));
  } catch {} // hosting de solo lectura: sigue en memoria
}

async function call(path_, body) {
  const res = await fetch(`${BASE}/${path_}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Gemini embeddings ${res.status}: ${(await res.text().catch(() => "")).slice(0, 160)}`);
  return res.json();
}

const reqFor = (text, taskType) => ({ model: `models/${model()}`, content: { parts: [{ text }] }, taskType, outputDimensionality: dim() });

/** Vectoriza en segundo plano las secciones nuevas o modificadas (no bloquea el chat). Guarda el avance tras cada lote. */
function index(sections) {
  if (!enabled() || !sections?.length) return Promise.resolve();
  if (failedAt && Date.now() - failedAt < RETRY_MS) return Promise.resolve();
  if (inflight) return inflight;
  inflight = (async () => {
    loadDisk();
    const mine = sections.filter(eligible);
    const hashes = mine.map(hashOf);
    const todo = [];
    mine.forEach((s, i) => !vecs.has(hashes[i]) && todo.push({ h: hashes[i], s }));
    const pause = Math.ceil((BATCH / RPM()) * 60 * 1000); // ms entre lotes para no pasar el límite por minuto
    let retries = 0;
    for (let i = 0; i < todo.length; ) {
      const chunk = todo.slice(i, i + BATCH);
      try {
        const data = await call(`models/${model()}:batchEmbedContents`, { requests: chunk.map((c) => reqFor(textOf(c.s), "RETRIEVAL_DOCUMENT")) });
        (data.embeddings || []).forEach((e, k) => e?.values && vecs.set(chunk[k].h, normalize(e.values)));
        saveDisk(hashes);
        i += BATCH;
        retries = 0;
        if (i < todo.length) await new Promise((r) => setTimeout(r, pause));
      } catch (e) {
        if (/ 429/.test(e.message) && ++retries <= 4) {
          await new Promise((r) => setTimeout(r, 65 * 1000)); // límite por minuto: espera y reintenta el mismo lote
          continue;
        }
        throw e;
      }
    }
    failedAt = 0;
    lastError = "";
  })()
    .catch((e) => {
      failedAt = Date.now();
      lastError = e.message.replace(/\s+/g, " ");
      console.log("IA embeddings:", lastError.slice(0, 200));
    })
    .finally(() => (inflight = null));
  return inflight;
}

async function embedQuery(question) {
  const key = String(question).trim().toLowerCase().slice(0, 300);
  if (qCache.has(key)) return qCache.get(key);
  const data = await call(`models/${model()}:embedContent`, reqFor(key, "RETRIEVAL_QUERY"));
  const v = normalize(data.embedding.values);
  qCache.set(key, v);
  if (qCache.size > 300) qCache.delete(qCache.keys().next().value);
  return v;
}

/**
 * Secciones más parecidas a la pregunta por significado.
 * @returns {Promise<{i: number, sim: number}[] | null>} null si no hay embeddings disponibles (se usa solo la búsqueda por palabras)
 */
async function rank(question, sections, top = 8) {
  if (!enabled()) return null;
  loadDisk();
  const have = sections.map((s) => (eligible(s) ? vecs.get(hashOf(s)) : undefined));
  const total = sections.filter(eligible).length;
  if (have.filter(Boolean).length < Math.max(5, total * 0.6)) return null; // aún indexando: por ahora solo palabras
  let q;
  try {
    q = await embedQuery(question);
  } catch (e) {
    lastError = e.message.replace(/\s+/g, " ");
    return null; // esta pregunta usa solo palabras; la siguiente vuelve a intentarlo
  }
  const out = [];
  have.forEach((v, i) => {
    if (!v) return;
    let d = 0;
    for (let k = 0; k < q.length; k++) d += q[k] * v[k];
    if (d >= minSim()) out.push({ i, sim: d });
  });
  return out.sort((a, b) => b.sim - a.sim).slice(0, top);
}

const status = () => ({ enabled: enabled(), model: model(), indexed: vecs.size, indexing: !!inflight, error: lastError });

module.exports = { index, rank, status, enabled, minSim, _internals: { normalize, vecs } };
