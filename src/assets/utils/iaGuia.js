/*
 * Guía web del servidor para la IA.
 *
 * Lee la(s) página(s) de información del servidor (por defecto WEB_URL + "/guia", o lo que pongas en
 * IA_GUIA_URL, varias separadas por coma), las convierte en texto, las divide por títulos y guarda una copia en
 * memoria. Cuando alguien pregunta algo, select() devuelve solo las secciones que tienen que ver con la pregunta.
 *
 *   IA_GUIA_URL="https://sampcity.app/guia"                 (o "off" para desactivarla)
 *   IA_GUIA_URL="https://sampcity.app/guia,https://sampcity.app/faq"
 *   IA_GUIA_URL="./src/assets/data/guia.md"                 (un archivo del propio bot: .md, .txt, .json o .html)
 *   IA_GUIA_TTL=30      minutos entre actualizaciones de la copia (si la web se cae se sigue usando la última)
 *
 * Funciona con HTML normal, texto/markdown y JSON. Si la página se arma con JavaScript en el navegador (el HTML
 * que recibe el bot viene casi vacío), no hay nada que leer: en ese caso hay que apuntar IA_GUIA_URL a una versión
 * con texto (ver LEEME).
 */
const fs = require("fs");
const TIMEOUT_MS = 10000;
const MAX_BYTES = 1.5 * 1024 * 1024;
const SECTION_MAX = 1400; // caracteres por trozo
const RETRY_MS = 2 * 60 * 1000; // si falló la primera carga, no se insiste en cada mensaje

const state = { ok: false, at: 0, failedAt: 0, error: null, sections: [], urls: [], df: new Map() };
let inflight = null;
let warned = false;

// ---------------------------------------------------------------------------------------------------------------
// Texto

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const STOP = new Set(
  "para como que con por los las del una uno unos unas este esta esto estos estas hay mas muy pero sus tus mis donde cuando quien cual cuales puedo puede pueden quiero quieres dime dame necesito tengo tiene tienen hacer hago veo ver sobre desde hasta entre algo alguien todo todos bot hola gracias favor servidor sampcity cuantos cuantas cuanto cuanta punto puntos existen existe listado lista todos todas cuales hay".split(" "),
);

const SYN_GROUPS = [
  "alquiler alquilar rentar renta arriendo arrendar",
  "dinero plata pesos lana billete efectivo",
  "trabajo chamba empleo oficio",
  "coche carro auto automovil vehiculo camioneta",
  "casa propiedad vivienda hogar apartamento",
  "policia poli lspd sapd",
  "medico ems ambulancia hospital paramedico",
  "gasolina combustible gasolinera",
  "estacionamiento parqueadero parking aparcar",
  "negocio empresa local",
  "comprar compra",
  "vender venta",
];
const baseStem = (w) => {
  let x = w;
  if (x.length > 4 && x.endsWith("es")) x = x.slice(0, -2);
  else if (x.length > 3 && x.endsWith("s")) x = x.slice(0, -1);
  return x.slice(0, 5);
};
const SYN = new Map();
for (const g of SYN_GROUPS) {
  const words = g.split(" ");
  const canon = baseStem(words[0]);
  for (const w of words) SYN.set(baseStem(w), canon);
}

function stems(text) {
  const out = new Set();
  for (const w of norm(text).split(" ")) {
    if (w.length < 3 || STOP.has(w)) continue;
    const st = baseStem(w);
    out.add(SYN.get(st) || st);
  }
  return out;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ntilde: "ñ", Ntilde: "Ñ", aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", uuml: "ü", iexcl: "¡", iquest: "¿", middot: "·", bull: "•", hellip: "…", ndash: "–", mdash: "—" };
function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(parseInt(n, 10), 0x10ffff)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Math.min(parseInt(n, 16), 0x10ffff)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in ENTITIES ? ENTITIES[name] : m));
}

// ---------------------------------------------------------------------------------------------------------------
// HTML / markdown / JSON -> secciones { title, body }

const MARK = "\u0001";
const END = "\u0002";

function htmlToSections(html, baseUrl) {
  let h = String(html);
  const pageTitle = decodeEntities((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(h) || [])[1] || "").trim();
  h = h.replace(/<!--[\s\S]*?-->/g, "");
  h = h.replace(/<(script|style|noscript|svg|template|iframe|head|nav)\b[\s\S]*?<\/\1>/gi, "");
  // enlaces: "texto (https://...)" para que la IA pueda dar los links reales
  h = h.replace(/<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, href, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text || /^(#|javascript:|mailto:|tel:)/i.test(href)) return text;
    let url;
    try {
      url = new URL(decodeEntities(href), baseUrl).href;
    } catch {
      return text;
    }
    return text.includes(url) || url === text ? text : `${text} (${url})`;
  });
  h = h.replace(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (m, lvl, inner) => `\n\n${MARK}${inner.replace(/<[^>]+>/g, " ")}${END}\n`);
  h = h.replace(/<li\b[^>]*>/gi, "\n• ");
  h = h.replace(/<br\s*\/?>/gi, "\n");
  h = h.replace(/<\/t[dh]>/gi, " | ");
  h = h.replace(/<\/?(p|div|section|article|header|footer|main|tr|ul|ol|table|details|summary|dd|dt|dl|blockquote|figure|form)\b[^>]*>/gi, "\n");
  h = h.replace(/<[^>]+>/g, "");
  h = decodeEntities(h).replace(/[<>]/g, "");

  const lines = h
    .split("\n")
    .map((l) => l.replace(/[ \t\u00a0]+/g, " ").replace(/^\s*\|\s*|\s*\|\s*$/g, "").trim())
    .filter((l, i, arr) => l || (arr[i - 1] && arr[i - 1] !== ""));
  const text = lines.join("\n");

  const sections = [];
  const parts = text.split(MARK);
  const intro = parts.shift().trim();
  if (intro.length > 40) sections.push({ title: pageTitle || "Información", body: intro });
  for (const part of parts) {
    const end = part.indexOf(END);
    const title = part.slice(0, end).replace(/\s+/g, " ").trim();
    const body = part.slice(end + 1).trim();
    if (body.length >= 15) sections.push({ title: title || pageTitle, body });
  }
  return { sections, textLength: text.length };
}

function markdownToSections(text) {
  const sections = [];
  let current = { title: "Información", body: [] };
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^#{1,3}\s+(.*)$/.exec(line);
    if (m) {
      if (current.body.join("").trim().length >= 15) sections.push({ title: current.title, body: current.body.join("\n").trim() });
      current = { title: m[1].trim(), body: [] };
    } else current.body.push(line);
  }
  if (current.body.join("").trim().length >= 15) sections.push({ title: current.title, body: current.body.join("\n").trim() });
  return { sections, textLength: String(text).length };
}

// Formato de /api/guia de la web de SampCity: { entries: [{ k, id, t, s, c, g, b, z, x, y, st, r }], popular, updated }
//   k = tipo (guia, comando, trabajo, faccion, lugar, negocio) · t = título · s = resumen · c = categoría
//   g = alias · b = cuerpo (o uso del comando) · z = lugar · st > 0 = solo staff
const KIND_LABEL = { guia: "Guía", comando: "Comando", trabajo: "Trabajo", faccion: "Facción", lugar: "Lugar", negocio: "Negocio" };

function entriesToSections(entries) {
  const sections = [];
  for (const e of entries) {
    if (!e || typeof e !== "object" || !e.t) continue;
    // Lo de staff no se le pasa a la IA: responde a cualquier jugador
    if (e.st > 0 || e.c === "Staff" || e.c === "Administracion") continue;
    const label = KIND_LABEL[e.k] || String(e.k || "Info");
    const lines = [];
    if (e.k === "comando") {
      lines.push(`Uso: ${e.b || e.t}`);
      if (e.g) lines.push(`También: ${e.g}`);
      if (e.s) lines.push(e.s);
      if (e.c) lines.push(`Categoría: ${e.c}`);
    } else {
      if (e.c) lines.push(`Categoría: ${e.c}`);
      if (e.s) lines.push(e.s);
      if (e.b) lines.push(e.b);
      if (e.z) lines.push(`Lugar: ${e.z}${e.x || e.y ? ` (${e.x}, ${e.y})` : ""}`);
      if (e.g) lines.push(`También se busca como: ${e.g}`);
    }
    const body = lines.join("\n").trim();
    if (body.length >= 5) sections.push({ title: `${label}: ${e.t}`, body, kind: e.k, name: e.t, brief: e.s || "", zone: e.z || "" });
  }
  return sections;
}

function jsonToSections(text) {
  const data = JSON.parse(text);
  if (data && Array.isArray(data.entries)) {
    const sections = entriesToSections(data.entries);
    return { sections, textLength: sections.reduce((n, s) => n + s.body.length, 0) };
  }
  const sections = [];
  const toText = (v) => (typeof v === "string" ? v : JSON.stringify(v));
  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      if (item && typeof item === "object") {
        const title = item.title || item.titulo || item.name || item.nombre || item.question || item.pregunta || `Elemento ${i + 1}`;
        const body = Object.entries(item)
          .filter(([k]) => !["title", "titulo", "name", "nombre", "question", "pregunta"].includes(k))
          .map(([, v]) => toText(v))
          .join("\n");
        sections.push({ title: String(title), body: body || String(title) });
      } else sections.push({ title: `Elemento ${i + 1}`, body: toText(item) });
    });
  } else if (data && typeof data === "object") {
    for (const [k, v] of Object.entries(data)) sections.push({ title: k, body: toText(v) });
  }
  return { sections: sections.filter((s) => s.body.length >= 5), textLength: text.length };
}

/** Trozos de como máximo SECTION_MAX caracteres, cortando por líneas. */
function splitLong(sections, source) {
  const out = [];
  for (const s of sections) {
    const clean = { title: s.title.slice(0, 120), source, kind: s.kind, name: s.name, brief: s.brief, zone: s.zone };
    if (s.body.length <= SECTION_MAX) {
      out.push({ ...clean, body: s.body });
      continue;
    }
    let part = "";
    let n = 1;
    for (const line of s.body.split("\n")) {
      if (part && part.length + line.length + 1 > SECTION_MAX) {
        out.push({ ...clean, title: `${clean.title} (parte ${n++})`, body: part });
        part = "";
      }
      part += (part ? "\n" : "") + line.slice(0, SECTION_MAX);
    }
    if (part) out.push({ ...clean, title: n > 1 ? `${clean.title} (parte ${n})` : clean.title, body: part });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Descarga

function guideUrls() {
  const raw = process.env.IA_GUIA_URL;
  if (raw && /^(off|no|false|0)$/i.test(raw.trim())) return [];
  if (raw && raw.trim()) return raw.split(",").map((u) => u.trim()).filter(Boolean);
  try {
    return [`${require("./brand").WEB()}/guia`];
  } catch {
    return [];
  }
}

const isLocalPath = (u) => /^(\.{1,2}[\\/]|\/|[a-zA-Z]:[\\/]|file:)/.test(u) && !/^https?:/i.test(u);

/** Convierte el contenido recibido en secciones según su tipo. */
function parseContent(body, type, baseUrl) {
  if (/json/i.test(type) || /^\s*[[{]/.test(body)) return jsonToSections(body);
  if ((/markdown|text\/plain/i.test(type) || /\.(md|txt)$/i.test(baseUrl)) && !/<html|<body/i.test(body)) return markdownToSections(body);
  return htmlToSections(body, baseUrl);
}

function checkParsed(parsed) {
  if (!parsed.sections.length || parsed.textLength < 200) {
    throw new Error("la página casi no tiene texto en el HTML (¿se arma con JavaScript?)");
  }
  return parsed;
}

async function httpGet(url) {
  const doFetch = globalThis.fetch || require("node-fetch");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await doFetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "SampCityBot/1.0 (+discord bot)", Accept: "text/html,text/markdown,text/plain,application/json;q=0.9,*/*;q=0.5" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let body = await res.text();
    if (body.length > MAX_BYTES) body = body.slice(0, MAX_BYTES);
    return { body, type: String(res.headers?.get?.("content-type") || ""), url: res.url || url };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOne(url) {
  // Archivo del propio bot (no depende de la web)
  if (isLocalPath(url)) {
    const file = url.replace(/^file:\/*/, url.startsWith("file:///") ? "/" : "");
    const body = (await fs.promises.readFile(file, "utf8")).slice(0, MAX_BYTES);
    return splitLong(checkParsed(parseContent(body, "", file)).sections, url);
  }

  const first = await httpGet(url);
  try {
    return splitLong(checkParsed(parseContent(first.body, first.type, first.url)).sections, url);
  } catch (err) {
    // Si la página se arma con JavaScript, se prueban versiones con texto de la misma dirección
    const u = new URL(url);
    const base = u.origin + u.pathname.replace(/\/$/, "");
    const alternatives = [`${base}.md`, `${base}.json`, `${base}.txt`, `${u.origin}/api${u.pathname.replace(/\/$/, "")}`];
    for (const alt of alternatives) {
      try {
        const r = await httpGet(alt);
        if (/<html|<!doctype/i.test(r.body.slice(0, 300))) continue; // la web devolvió su página de siempre
        return splitLong(checkParsed(parseContent(r.body, r.type, r.url)).sections, alt);
      } catch {}
    }
    throw err;
  }
}


// ---------------------------------------------------------------------------------------------------------------
// Reglas y FAQ de la web: son publicaciones (/api/posts?type=rules|faq), no salen en /api/guia.
//   IA_GUIA_POSTS=rules,faq     (por defecto; "off" para desactivar)
const POST_LABEL = { rules: "Regla", faq: "Pregunta frecuente" };
const MAX_POST_PAGES = 8; // la web pagina de 12 en 12

function postsToSections(posts, type) {
  const label = POST_LABEL[type] || "Info";
  const out = [];
  for (const p of posts) {
    if (!p || typeof p !== "object") continue;
    const text = String(p.body || "").replace(/\r/g, "").trim();
    const title = String(p.title || text.split("\n")[0] || "").replace(/\s+/g, " ").trim().slice(0, 100);
    if (!title || text.length < 5) continue;
    // El autor, los likes y los ids no se envían: solo título y texto
    out.push({ title: `${label}: ${title}`, body: text.startsWith(title) ? text : `${title}\n${text}`, kind: type, name: title, brief: "", zone: "" });
  }
  return out;
}

async function fetchPosts(type) {
  let base = String(process.env.WEB_URL || "").replace(/\/+$/, "");
  if (!base) {
    try {
      base = require("./brand").WEB();
    } catch {
      return [];
    }
  }
  const all = [];
  for (let page = 0; page < MAX_POST_PAGES; page++) {
    const r = await httpGet(`${base}/api/posts?type=${type}&page=${page}`);
    const list = JSON.parse(r.body);
    if (!Array.isArray(list)) throw new Error("respuesta inesperada");
    all.push(...list.slice(0, 12));
    if (list.length <= 12) break; // la web manda 13 cuando hay otra página
  }
  return splitLong(postsToSections(all, type), `${base}/${type === "rules" ? "reglas" : "faq"}`);
}

function postTypes() {
  const raw = String(process.env.IA_GUIA_POSTS ?? "rules,faq").trim();
  if (/^(off|no|false|0)$/i.test(raw)) return [];
  return raw.split(",").map((t) => t.trim()).filter((t) => POST_LABEL[t]);
}

async function refresh() {
  const urls = guideUrls();
  state.urls = urls;
  if (!urls.length && !postTypes().length) {
    state.ok = false;
    state.error = "desactivada";
    state.failedAt = Date.now();
    return;
  }
  const all = [];
  const errors = [];
  for (const url of urls) {
    try {
      all.push(...(await fetchOne(url)));
    } catch (err) {
      errors.push(`${url}: ${err.name === "AbortError" ? "tiempo agotado" : err.message}`);
    }
  }
  for (const type of postTypes()) {
    try {
      all.push(...(await fetchPosts(type)));
    } catch (err) {
      errors.push(`${type}: ${err.name === "AbortError" ? "tiempo agotado" : err.message}`);
    }
  }
  if (all.length) {
    const df = new Map();
    for (const s of all) {
      s.titleStems = stems(s.title);
      s.bodyStems = stems(s.body);
      for (const t of new Set([...s.titleStems, ...s.bodyStems])) df.set(t, (df.get(t) || 0) + 1);
    }
    Object.assign(state, { ok: true, at: Date.now(), error: errors.join(" | ") || null, sections: all, df, failedAt: 0 });
    require("./iaEmbeddings").index(all).catch(() => {}); // búsqueda semántica: vectoriza lo nuevo en segundo plano
    if (!warned || errors.length === 0) {
      console.log(`IA guía: ${all.length} secciones leídas (v4 listados completos) de ${urls.length} página(s)`);
      warned = true;
    }
  } else {
    state.failedAt = Date.now();
    state.error = errors.join(" | ");
    if (!state.ok) console.log("IA guía: no se pudo leer →", state.error);
  }
}

/** Devuelve el estado de la guía; la primera vez espera la descarga, después actualiza en segundo plano. */
async function load() {
  const ttl = (parseFloat(process.env.IA_GUIA_TTL) || 30) * 60 * 1000;
  if (state.ok && Date.now() - state.at < ttl) return state;
  if (!state.ok && state.failedAt && Date.now() - state.failedAt < RETRY_MS) return state;
  if (!inflight) inflight = refresh().catch((e) => console.log("IA guía:", e.message)).finally(() => (inflight = null));
  if (state.ok) return state; // hay copia vieja: se usa mientras se actualiza
  await inflight;
  return state;
}

// ---------------------------------------------------------------------------------------------------------------
// Búsqueda

/**
 * Las secciones de la guía más relacionadas con la pregunta.
 * @returns {{ text: string, titles: string[] }}
 */
function select(question, { maxChars = 2800, maxSections = 4 } = {}) {
  if (!state.ok || !state.sections.length) return { text: "", titles: [] };
  const q = stems(question);
  const N = state.sections.length;
  const scored = [];
  if (q.size) {
    for (const s of state.sections) {
      let score = 0;
      for (const t of q) {
        const w = Math.log(1 + N / (state.df.get(t) || N));
        if (s.titleStems.has(t)) score += 2.5 * w;
        else if (s.bodyStems.has(t)) score += w;
      }
      if (score > 0) scored.push({ s, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.score || 0;
  const picked = [];
  let used = 0;
  if (best >= 1) {
    for (const { s, score } of scored) {
      if (picked.length >= maxSections || score < best * 0.45) break;
      const block = `## ${s.title}\n${s.body}`;
      if (used + block.length > maxChars) continue;
      picked.push(s);
      used += block.length + 1;
    }
  }
  return {
    text: picked.map((s) => `## ${s.title}\n${s.body}`).join("\n"),
    titles: picked.map((s) => s.title),
  };
}

/**
 * Igual que select() pero mezcla la búsqueda por palabras con la semántica (embeddings de Gemini) por fusión de rangos.
 * Si los embeddings no están listos o fallan, devuelve exactamente lo mismo que select().
 */
async function selectSemantic(question, { maxChars = 2800, maxSections = 4 } = {}) {
  if (!state.ok || !state.sections.length) return { text: "", titles: [] };
  const emb = require("./iaEmbeddings");
  const sem = await emb.rank(question, state.sections, 8).catch(() => null);
  if (!sem || !sem.length) return select(question, { maxChars, maxSections });

  // ranking por palabras (misma puntuación que select)
  const q = stems(question);
  const N = state.sections.length;
  const lex = [];
  state.sections.forEach((sec, i) => {
    let score = 0;
    for (const t of q) {
      const w = Math.log(1 + N / (state.df.get(t) || N));
      if (sec.titleStems.has(t)) score += 2.5 * w;
      else if (sec.bodyStems.has(t)) score += w;
    }
    if (score > 0) lex.push({ i, score });
  });
  lex.sort((a, b) => b.score - a.score);
  const lexBest = lex[0]?.score || 0;
  const lexList = lexBest >= 1 ? lex.filter((x) => x.score >= lexBest * 0.45).slice(0, 8) : [];

  // fusión de rangos (RRF): lo que aparece en ambas listas sube; lo que solo ve una igual puede entrar
  const K = 60;
  const fused = new Map();
  lexList.forEach((x, r) => fused.set(x.i, (fused.get(x.i) || 0) + 1 / (K + r)));
  // lo que solo ve la semántica (sin ninguna palabra en común) exige una similitud algo mayor, para no traer cosas que no tocan
  const lexSet = new Set(lexList.map((x) => x.i));
  const strict = emb.minSim() + 0.05;
  sem.forEach((x, r) => {
    if (!lexSet.has(x.i) && x.sim < strict) return;
    fused.set(x.i, (fused.get(x.i) || 0) + 1 / (K + r));
  });
  if (!fused.size) return select(question, { maxChars, maxSections });
  const ranked = [...fused.entries()].sort((a, b) => b[1] - a[1]);
  const best = ranked[0][1];

  const picked = [];
  let used = 0;
  for (const [i, sc] of ranked) {
    if (picked.length >= maxSections || sc < best * 0.5) break;
    const sec = state.sections[i];
    const block = `## ${sec.title}\n${sec.body}`;
    if (used + block.length > maxChars) continue;
    picked.push(sec);
    used += block.length + 1;
  }
  return { text: picked.map((x) => `## ${x.title}\n${x.body}`).join("\n"), titles: picked.map((x) => x.title), semantic: true };
}


const KIND_WORDS = [
  ["trabajo", /trabaj|oficio|empleo|chamba/],
  ["comando", /comando/],
  ["faccion", /faccion/],
  ["lugar", /lugar|ubicacion/],
  ["negocio", /negocio|empresa/],
  ["guia", /\bguias?\b|articulo/],
];
const PLURAL = { trabajo: "TRABAJOS", comando: "COMANDOS", faccion: "FACCIONES", lugar: "LUGARES", negocio: "NEGOCIOS", guia: "GUÍAS" };

/**
 * Para preguntas de conteo o lista ("cuántos trabajos hay", "qué facciones existen") la búsqueda por trozos no sirve:
 * aquí se devuelve el listado completo de ese tipo, con el total.
 */
function catalog(question, maxChars = 1800) {
  if (!state.ok) return "";
  const q = norm(question);
  if (!/cuant|lista|listado|todos|todas|cuales|que .*(hay|existen|tiene)|numero de/.test(q)) return "";
  const out = [];
  for (const [kind, re] of KIND_WORDS) {
    if (!re.test(q)) continue;
    const seen = new Set();
    const items = [];
    for (const s of state.sections) {
      if (s.kind !== kind || !s.name || seen.has(s.name)) continue;
      seen.add(s.name);
      items.push(s.brief ? `${s.name} (${s.brief.slice(0, 60)})` : s.name);
    }
    if (!items.length) continue;
    let text = "";
    let shown = 0;
    for (const it of items) {
      if (text.length + it.length > maxChars) break;
      text += (text ? "; " : "") + it;
      shown++;
    }
    out.push(`${PLURAL[kind]} EN LA GUÍA: ${items.length} en total${shown < items.length ? ` (se muestran ${shown})` : ""}: ${text}.`);
  }
  return out.join("\n");
}

/**
 * Preguntas de conteo/lista sobre cualquier tema ("cuántos puntos de renta de motos hay"): devuelve TODAS las entradas
 * de la guía que contienen todas las palabras clave (no solo las 4 más parecidas), con el total.
 */
function matching(question, maxItems = 40, maxChars = 1800) {
  if (!state.ok) return "";
  const qn = norm(question);
  if (!/cuant|lista|listado|todos|todas|cuales|que .*(hay|existen)|numero de|donde (hay|puedo)/.test(qn)) return "";
  const q = stems(question);
  if (!q.size) return "";
  const need = q.size <= 2 ? q.size : Math.ceil(q.size * 0.7);
  // Primero se busca en título y resumen (más preciso); si no sale nada, en todo el texto
  const collect = (inBody) => {
    const seen = new Set();
    const out = [];
    for (const sec of state.sections) {
      const head = new Set([...sec.titleStems, ...stems(sec.brief || "")]);
      let hits = 0;
      for (const t of q) if (head.has(t) || (inBody && sec.bodyStems.has(t))) hits++;
      if (hits < need) continue;
      const name = (sec.name || sec.title).replace(/\s*\(parte \d+\)$/, "");
      const key = `${sec.kind || ""}:${name}:${sec.zone || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: sec.kind, name, brief: sec.brief || "", zone: sec.zone || "" });
    }
    return out;
  };
  let found = collect(false);
  if (!found.length) found = collect(true);
  console.log(`IA guía: pregunta de conteo, palabras [${[...q].join(", ")}] → ${found.length} coincidencias`);
  if (!found.length) return "";

  // Agrupado por tipo, con el total de cada uno, sin repetir prefijos ni descripciones iguales
  const byKind = new Map();
  for (const f of found) {
    if (!byKind.has(f.kind)) byKind.set(f.kind, []);
    byKind.get(f.kind).push(f);
  }
  const lines = [];
  for (const [kind, list] of byKind) {
    const label = KIND_LABEL[kind] || kind || "Información";
    const names = list.map((x) => x.name);
    // prefijo común tipo "Alquiler de motos: " fuera de cada nombre
    const pre = names.length > 2 && names.every((n) => n.includes(": ") && n.split(": ")[0] === names[0].split(": ")[0]) ? names[0].split(": ")[0] + ": " : "";
    const short = names.map((n) => n.slice(pre.length));
    const zones = new Map();
    for (const x of list) {
      const city = String(x.zone || "").split(",").pop().trim();
      if (city) zones.set(city, (zones.get(city) || 0) + 1);
    }
    const sameBrief = list.every((x) => x.brief === list[0].brief) && list[0].brief;
    let text = "";
    let shown = 0;
    for (const n of short) {
      if (text.length + n.length > 900) break;
      text += (text ? "; " : "") + n;
      shown++;
    }
    lines.push(
      `${PLURAL[kind] || label.toUpperCase()} QUE COINCIDEN CON LA PREGUNTA: ${list.length} en total${pre ? ` (${pre.replace(/: $/, "")})` : ""}` +
        `${zones.size ? `. Por zona: ${[...zones].map(([c, n]) => `${c} ${n}`).join(", ")}` : ""}` +
        `${sameBrief ? `. Todos: ${sameBrief.slice(0, 120).replace(/\.+$/, "")}` : ""}` +
        `. ${shown < list.length ? `Primeros ${shown}` : "Lista"}: ${text}.`,
    );
  }
  return lines.join("\n");
}

/** Lista corta de temas de la guía (para preguntas generales como "qué información hay del servidor"). */
function topics(max = 24) {
  if (!state.ok) return "";
  const seen = new Set();
  const out = [];
  for (const s of state.sections) {
    const t = s.title.replace(/\s*\(parte \d+\)$/, "");
    if (seen.has(t) || !t) continue;
    seen.add(t);
    out.push(t.slice(0, 50));
    if (out.length >= max) break;
  }
  return out.join(" · ");
}

function status() {
  return { ok: state.ok, urls: state.urls, sections: state.sections.length, at: state.at, error: state.error };
}

function reset() {
  Object.assign(state, { ok: false, at: 0, failedAt: 0, error: null, sections: [], urls: [], df: new Map() });
  inflight = null;
  warned = false;
}

module.exports = { load, select, selectSemantic, catalog, matching, topics, status, _internals: { postsToSections, htmlToSections, markdownToSections, jsonToSections, entriesToSections, stems, splitLong, reset } };
