/*
 * Conocimiento del servidor para la IA.
 *
 * Fuente principal: la guía web del servidor (iaGuia.js, por defecto WEB_URL + "/guia").
 * Lo demás sale de lo que el bot ya sabe (no se escribe a mano, así no se queda viejo):
 *   - normas, primeros pasos y verificación: los mismos textos que publica /reorganizar (serverMessages.js);
 *     solo se usan si la guía web no se pudo leer
 *   - tipos de ticket: assets/data/tickets.js
 *   - canales: el plano del servidor (assets/data/serverLayout.js) resuelto con los canales reales de la guild
 *   - comandos: los comandos de barra cargados en client.commands (con sus atajos con prefijo)
 *   - rangos del staff: assets/data/rangos.js
 *
 * getKnowledge() elige solo los trozos que tienen que ver con la pregunta, para no gastar tokens de más
 * (los planes gratis tienen límite de tokens por minuto).
 */
const guia = require("./iaGuia");
const enVivo = require("./iaEnVivo");
const correcciones = require("./iaCorrecciones");

const MAX_CHARS = parseInt(process.env.IA_CONOCIMIENTO) || 3500;
const TTL = 10 * 60 * 1000;

const factsCache = new Map(); // guildId -> { at, chunks, channels }
let catalogCache = null;

// ---------------------------------------------------------------------------------------------------------------
// Texto

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ/!]+/g, " ")
    .trim();

const STOP = new Set(
  "para como que con por los las del una uno unos unas este esta esto estos estas hay mas muy pero sus tus mis donde cuando quien cual cuales puedo puede pueden quiero quieres dime dame necesito tengo tiene tienen hacer hago veo ver sobre desde hasta entre algo alguien todo todos bot hola gracias favor".split(" "),
);

/** Raíces de 5 letras de las palabras que importan (para que "comandos" encaje con "comando"). */
function stems(text) {
  const out = new Set();
  for (const w of norm(text).replace(/[/!]/g, " ").split(" ")) {
    if (w.length < 3 || STOP.has(w)) continue;
    out.add(w.slice(0, 5));
  }
  return out;
}

const clip = (s, max) => (String(s).length > max ? String(s).slice(0, max - 1) + "…" : String(s));
const oneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------------------------------------------
// Comandos

const SKIP_COMMANDS = new Set(["developers", "prueba"]); // solo para el dueño del bot

function requiredOptions(options, shown) {
  return (options || [])
    .filter((o) => o.type > 2 && o.required)
    .map((o) => ` <${shown(o.name)}>`)
    .join("");
}

function buildCatalog(client) {
  if (catalogCache && catalogCache.size === client.commands.size) return catalogCache;

  let names = {};
  let ALIASES = {};
  try {
    names = require("./localizations").names || {};
  } catch {}
  try {
    ALIASES = require("./prefixCommands").ALIASES || {};
  } catch {}
  const shown = (n) => names[n] || n;

  // atajos: "economy::balance" -> ["saldo", "bal", ...]
  const shortcuts = new Map();
  for (const [alias, a] of Object.entries(ALIASES)) {
    const key = `${a.command}:${a.group || ""}:${a.sub}`;
    shortcuts.set(key, [...(shortcuts.get(key) || []), alias]);
  }

  const entries = [];
  const categories = [];
  for (const [name, command] of client.commands) {
    if (SKIP_COMMANDS.has(name)) continue;
    let json;
    try {
      json = command.data.toJSON();
    } catch {
      continue;
    }
    categories.push({ name: shown(name), description: json.description || "" });

    const walk = (options, group) => {
      for (const o of options || []) {
        if (o.type === 2) walk(o.options, o); // grupo de subcomandos
        else if (o.type === 1) {
          if (o.name === "help") continue;
          const alias = shortcuts.get(`${name}:${group?.name || ""}:${o.name}`) || [];
          const path = ["/" + shown(name), group ? shown(group.name) : null, shown(o.name)].filter(Boolean).join(" ");
          entries.push({
            text: `${path}${requiredOptions(o.options, shown)} — ${oneLine(o.description)}${alias.length ? ` (atajo: ${alias.slice(0, 3).map((a) => "!" + a).join(", ")})` : ""}`,
            nameStems: stems([name, shown(name), group?.name, o.name, shown(o.name), ...alias].join(" ")),
            descStems: stems(`${o.description} ${json.description}`),
          });
        }
      }
    };
    const hasSubs = (json.options || []).some((o) => o.type === 1 || o.type === 2);
    if (hasSubs) walk(json.options);
    else
      entries.push({
        text: `/${shown(name)}${requiredOptions(json.options, shown)} — ${oneLine(json.description)}`,
        nameStems: stems(`${name} ${shown(name)}`),
        descStems: stems(json.description),
      });
  }
  catalogCache = { size: client.commands.size, entries, categories };
  return catalogCache;
}

const COMMAND_QUESTION = /comando|prefijo|ayuda|funcion|que (puedes|sabes|haces)|como (se )?(usa|uso|hago|veo|consigo|puedo)|para que sirve|\/\w|![a-z]/;

function findCommands(client, question, max = 8) {
  const cat = buildCatalog(client);
  const q = stems(question);
  const asking = COMMAND_QUESTION.test(norm(question));
  if (!q.size) return { lines: [], asking, categories: cat.categories };
  const scored = [];
  for (const e of cat.entries) {
    let name = 0;
    let desc = 0;
    for (const s of q) {
      if (e.nameStems.has(s)) name++;
      else if (e.descStems.has(s)) desc++;
    }
    const score = name * 3 + desc;
    if (name > 0 || desc >= (asking ? 1 : 2)) scored.push({ e, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return { lines: scored.slice(0, max).map((s) => s.e.text), asking, categories: cat.categories };
}

// ---------------------------------------------------------------------------------------------------------------
// Datos del servidor (cacheados por guild)

const CATEGORY_WORDS = {
  inicio: "empezar|empieza|empiezo|bienvenid|verific|norma|regla|soporte|ticket|primeros",
  novedades: "novedad|anuncio|alerta|evento|sorteo|encuesta|postulacion|alianza|booster|actualiz",
  guia: "guia|descarga|descargar|faq|pregunta|comando|trabajo|banda|habilidad|economia|citycoin|vip|socio|emoji",
  comunidad: "general|chat|off|imagen|captura|clip|meme|creador|directo|tiktok|sugerencia|resena|destacado|nivel|cumple|despedida",
  fortuna: "fortuna|millonario|ranking|logro|recompensa|invitad",
  juegos: "juego|contar|numero|palabra|serpiente|minijuego",
  facciones: "faccion|policia|sheriff|fbi|militar|gobierno|citytv|banda",
};

function resolveChannels(guild) {
  const out = [];
  try {
    const { CATEGORIES } = require("../data/serverLayout");
    const { textChannel } = require("./guildLookup");
    for (const cat of CATEGORIES) {
      for (const ch of cat.channels || []) {
        const found = textChannel(guild, ch.match);
        if (found) out.push({ cat: cat.key, catName: cat.name.replace(/[^\p{L}\p{N} ]/gu, "").trim(), key: ch.key, topic: ch.topic || "", channel: found });
      }
    }
  } catch {}
  return out;
}

const embedText = (embed) => {
  const d = embed?.data || embed || {};
  const title = oneLine(String(d.title || "").replace(/^▌\s*/, ""));
  const fields = (d.fields || []).map((f) => `${oneLine(f.name)}: ${oneLine(f.value)}`).join("\n");
  const body = [oneLine(d.description || ""), fields].filter(Boolean).join("\n");
  return { title, body };
};

function buildFacts(client, guild, prefix) {
  const chunks = [];
  const channels = resolveChannels(guild);
  const chMap = new Map(channels.map((c) => [c.key, c.channel]));
  const mention = (key, fallback) => (chMap.get(key) ? `${chMap.get(key)}` : fallback);

  let project = process.env.IA_PROYECTO || String(client.config?.discord?.footer || "").split("·")[0].trim() || guild.name;
  let web = "";
  let ip = "";
  try {
    const brand = require("./brand");
    web = brand.WEB();
    ip = brand.SERVER_IP();
  } catch {}

  const created = guild.createdAt ? new Date(guild.createdAt).toLocaleDateString("es-CO", { dateStyle: "long" }) : "";
  chunks.push({
    id: "base",
    always: true,
    text: [
      `Proyecto: ${project} — ciudad de rol en SA-MP (San Andreas Multiplayer) con su Discord, servidor de juego y web.`,
      web ? `Web: ${web} (verificar cuenta: ${web}/verificar)${ip ? ` · IP del servidor de juego: ${ip}` : ""}` : "",
      `Discord «${oneLine(guild.name)}»: ${guild.memberCount ?? "?"} miembros${created ? `, creado el ${created}` : ""}.`,
      `Ayuda del staff: abre un ticket en ${mention("soporte", "el canal de soporte")}.`,
      `Los comandos del bot se usan con / y también con el prefijo ${prefix} (ej. ${prefix}samp perfil). Dentro del juego existe /comandos (no tienes su lista).`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  // Normas, primeros pasos y verificación: los mismos mensajes que publica el bot
  try {
    const serverMessages = require("./serverMessages");
    const sections = serverMessages.rules(guild, chMap).flatMap((m) => m.embeds);
    const sectionKeys = [
      /insult|acoso|respeto|trato|amenaz|discrimin|datos personales|toxic/,
      /spam|meme|contenido|publicidad|alianza|flood|cadena|nsfw|canal/,
      /cuenta|apodo|multicuenta|contrasena|vincul|verific|comprar cuenta|vender cuenta/,
      /rol|matar|hack|mod|bug|macro|faccion|banda|metagaming|powergaming|dentro del juego|interpret/,
      /sancion|advertencia|warn|ban|jail|silenc|mute|apel|castigo|injust/,
      /staff|moderador|admin|contrasena|pago|trato al staff/,
    ];
    let i = 0;
    for (const embed of sections) {
      const { title, body } = embedText(embed);
      if (!body) continue;
      const numbered = /^\d/.test(title);
      chunks.push({
        id: `normas-${title || i}`,
        keys: new RegExp(numbered ? `${sectionKeys[i]?.source || "norma"}|norma|regla|permitido|prohibido` : "norma|regla"),
        text: `NORMAS — ${title || "General"}: ${body}`,
        rule: true,
        fallback: true,
      });
      if (numbered) i++;
    }
    for (const m of serverMessages.guide(guild, chMap)) {
      const { title, body } = embedText(m.embeds[0]);
      chunks.push({
        id: "primeros-pasos",
        fallback: true,
        keys: /empez|primer|comenz|entrar|jugar|unir|registr|crear cuenta|descarg|conectar|ip |nuevo|como (entro|juego|empiezo)/,
        text: `${title || "PRIMEROS PASOS"}: ${body}`,
      });
    }
  } catch {}

  try {
    const verification = require("./verification");
    const { body } = embedText(verification.panel(guild).embeds[0]);
    if (body)
      chunks.push({
        id: "verificacion",
        fallback: true,
        keys: /verific|vincul|no puedo entrar|canales (bloqueados|ocultos)|apodo|link/,
        text: `VERIFICACIÓN (canal ${mention("verificacion", "de verificación")}): ${body}`,
      });
  } catch {}

  try {
    const { TYPES } = require("../data/tickets");
    chunks.push({
      id: "tickets",
      fallback: true,
      keys: /ticket|soporte|ayuda|reporte|reportar|denunci|apel|bug|fallo|tienda|vip|citycoin|compra|pago|faccion|banda|staff|sancion|injust|\bban\b|castig/,
      text: `TICKETS (se abren en ${mention("soporte", "el canal de soporte")}): ${TYPES.map((t) => `${t.label} (${t.desc})`).join("; ")}.`,
    });
  } catch {}

  try {
    const { RANKS } = require("../data/rangos");
    const staff = RANKS.filter((r) => r.cat === "staff").map((r) => r.role);
    const cargos = RANKS.filter((r) => r.cat === "cargo").map((r) => r.role);
    chunks.push({
      id: "staff",
      fallback: true,
      keys: /staff|rango|moderador|administrador|admin|ayudante|soporte|fundador|desarrollador|scripter|mapper|equipo|cargo/,
      text: `STAFF (de mayor a menor): ${staff.join(", ")}. Cargos especiales: ${cargos.join(", ")}.`,
    });
  } catch {}


  // Fortuna: el minijuego de economía del bot de Discord (no es el servidor de juego)
  try {
    const f = require("../data/fortuna");
    const n = (v) => Number(v).toLocaleString("es-CO");
    const jobs = f.JOBS.map((j) => `${j.name} ($${n(j.pay[0])}-${n(j.pay[1])} por turno, cada ${j.cooldown} min${j.needs ? ", requiere " + Object.entries(j.needs).map(([k, v]) => `${v} ${k.replace(/s$/, "")}`).join(" y ") : ""})`).join("; ");
    const cats = Object.values(f.CATEGORIES)
      .map((c) => {
        const prices = c.items.map((i) => i.price);
        return `${c.name} (${c.items.length}, de $${n(Math.min(...prices))} a $${n(Math.max(...prices))})`;
      })
      .join(", ");
    chunks.push({
      id: "fortuna",
      keys: /oficio|trabaj|fortuna|sueldo|turno|asalt|heist|magnate|minijuego/,
      text:
        `FORTUNA — minijuego de economía que se juega SOLO en Discord con comandos /fortuna (NO es el servidor de juego ni toca tu cuenta del juego). ` +
        `Hay ${f.JOBS.length} oficios: ${jobs}. ` +
        `Se compran con el dinero de Discord: ${cats}. ` +
        `Hay ${f.HEISTS.length} asaltos con riesgo de multa, y cada domingo las 3 mayores fortunas reciben premio.`,
    });
  } catch {}

  // Directorio de canales por categoría
  const byCat = new Map();
  for (const c of channels) {
    if (!byCat.has(c.cat)) byCat.set(c.cat, { name: c.catName, items: [] });
    byCat.get(c.cat).items.push(`${c.channel}${c.topic ? ` (${c.topic.replace(/\.$/, "")})` : ""}`);
  }
  for (const [cat, { name, items }] of byCat) {
    const words = CATEGORY_WORDS[cat] || cat;
    chunks.push({
      id: `canales-${cat}`,
      keys: new RegExp(words),
      generic: cat === "inicio" || cat === "guia",
      text: `CANALES — ${name}: ${items.join(" · ")}`,
    });
  }

  return { at: Date.now(), chunks };
}

// ---------------------------------------------------------------------------------------------------------------

/**
 * Devuelve el texto de conocimiento relevante para la pregunta (o "" si no hay nada).
 * @param {string} question  lo que escribió el usuario (y, si responde a algo, ese texto)
 */
/** Igual que getKnowledgeEx pero devuelve solo el texto (compatibilidad). */
async function getKnowledge(client, guild, question, prefix = "!", userId = null) {
  return (await getKnowledgeEx(client, guild, question, prefix, userId)).text;
}

/**
 * @returns {Promise<{text: string, relevant: boolean, sources: string[], corrections: number}>}
 *   relevant: hubo algo útil para la pregunta (corrección, guía, comandos, datos en vivo o textos del servidor).
 *   sources: títulos de las secciones de la guía usadas (para que la IA cite la fuente).
 */
async function getKnowledgeEx(client, guild, question, prefix = "!", userId = null) {
  let relevant = false;
  let sources = [];
  const guide = await guia.load().catch(() => ({ ok: false }));
  let facts = factsCache.get(guild.id);
  if (!facts || Date.now() - facts.at > TTL) {
    facts = buildFacts(client, guild, prefix);
    factsCache.set(guild.id, facts);
  }

  const q = norm(question);
  const wantsChannels = /canal|donde|ubic|encuentro|dirijo|lugar/.test(q);
  const generalAsk = /servidor|comunidad|proyecto|sampcity|ciudad|de que (va|trata)|que es |informacion|info\b/.test(q);

  const scored = [];
  for (const c of facts.chunks) {
    if (c.always) continue;
    if (c.fallback && guide.ok) continue; // con la guía web leída, no se mezclan los textos del código
    let score = c.keys ? (q.match(new RegExp(c.keys.source, "g")) || []).length : 0;
    if (!score && wantsChannels && c.generic) score = 1;
    if (!score && generalAsk && (c.id === "primeros-pasos" || c.id === "canales-inicio")) score = 1;
    if (c.rule && score && /norma|regla/.test(q)) score += 1; // "las normas" -> todas las secciones
    if (score) scored.push({ c, score });
  }
  scored.sort((a, b) => b.score - a.score);

  const parts = [];
  let used = 0;
  // si piden "las normas" se deja más espacio para que entren todas las secciones
  const limit = /norma|regla/.test(q) ? Math.round(MAX_CHARS * 1.6) : MAX_CHARS;
  const add = (text) => {
    if (used + text.length > limit) return false;
    parts.push(text);
    used += text.length + 1;
    return true;
  };
  for (const c of facts.chunks) if (c.always) add(c.text);

  // Correcciones del staff: prioridad máxima (van antes que la guía y no se descartan por falta de espacio)
  const fix = await correcciones.knowledgeBlock(guild.id, question).catch(() => ({ text: "", count: 0 }));
  if (fix.text) {
    parts.push(fix.text);
    used += fix.text.length + 1;
    relevant = true;
  }

  // Conteos y listas de la guía ("cuántos puntos de renta de motos hay"): van primero y no se descartan por falta de espacio
  if (guide.ok) {
    const cat = guia.catalog(question) || guia.matching(question);
    if (cat) {
      parts.push(`LISTADO COMPLETO DE LA GUÍA OFICIAL (el total es exacto, cuéntalo tal cual):\n${cat}`);
      used += cat.length + 80;
      relevant = true;
    }
  }

  // Comandos relacionados con la pregunta
  const found = findCommands(client, question);
  if (found.lines.length) relevant = true;
  if (found.lines.length) add("COMANDOS DEL BOT DE DISCORD (se escriben en Discord, no dentro del juego):\n" + found.lines.join("\n"));
  else if (found.asking && found.categories.length)
    add(`CATEGORÍAS DE COMANDOS: ${found.categories.map((c) => "/" + c.name).join(", ")}. Con /ayuda o ${prefix}comandos sale el panel completo.`);

  // Datos en vivo de la base del servidor (conectados, staff, crews, cuenta de quien pregunta): solo si la pregunta lo pide
  const live = await enVivo.getLive(question, userId).catch(() => "");
  if (live) relevant = true;
  if (live) add(`DATOS EN VIVO DEL SERVIDOR (consultados ahora mismo):\n${live}`);

  // Guía web del servidor (fuente principal)
  if (guide.ok) {

    const url = guia.status().urls[0] || "";
    const g = await guia.selectSemantic(question, { maxChars: Math.max(800, limit - used - 150) }).catch(() => guia.select(question, { maxChars: Math.max(800, limit - used - 150) }));
    if (g.text) {
      relevant = true;
      sources = g.titles || [];
      add(`GUÍA OFICIAL DEL SERVIDOR (${url}):\n${g.text}`);
    }
    else if (generalAsk || /guia|informacion|\binfo\b|ayuda|que hay/.test(q)) {
      const t = guia.topics();
      if (t) add(`TEMAS DE LA GUÍA OFICIAL (${url}): ${t}`);
    }
  }

  if (scored.length) relevant = true;
  for (const { c } of scored) add(clip(c.text, 1200));
  return { text: parts.join("\n"), relevant, sources, corrections: fix.count };
}

function projectName(client, guild) {
  return process.env.IA_PROYECTO || String(client.config?.discord?.footer || "").split("·")[0].trim() || guild.name;
}

module.exports = { getKnowledge, getKnowledgeEx, projectName, _internals: { stems, findCommands, buildCatalog, norm, factsCache } };
