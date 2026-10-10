/*
 * Detección de reportes duplicados (solo tickets de tipo "bug").
 *
 * Al enviar el formulario de un fallo se buscan tickets "bug" recientes (abiertos o cerrados) que hablen de lo mismo.
 * Si hay parecidos, el usuario ve (solo él) cuáles son y elige: "Es lo mismo" (no se abre ticket) o "Es distinto,
 * abrir mi ticket". Si abre el suyo, el ticket queda marcado con "Posible duplicado de #0123" para el staff.
 * No usa IA ni envía nada fuera: es una comparación de palabras. Al usuario nunca se le enseña el texto completo ni el
 * canal de otra persona, solo número, estado, antigüedad y el "dónde pasa" recortado y sin correos ni IPs.
 *
 *   TICKETS_DUP=0          desactiva la función
 *   TICKETS_DUP_DIAS=30    cuánto hacia atrás se busca
 */
const Discord = require("discord.js");
const Info = require("../../database/models/ticketInfo");

const PENDING = new Map(); // "guild:user" -> { typeKey, answers, dupOf, at }
const PENDING_MS = 10 * 60 * 1000;
const MAX_SHOWN = 3;
const MIN_SHARED = 3;
const MIN_SCORE = 0.5;

const enabled = () => !/^(0|off|no|false)$/i.test(String(process.env.TICKETS_DUP ?? "1").trim());
const days = () => {
  const v = parseFloat(process.env.TICKETS_DUP_DIAS);
  return Number.isFinite(v) && v > 0 ? v : 30;
};

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP = new Set(
  "para como que con por los las del una uno unos unas este esta esto estos estas hay mas muy pero sus tus mis donde cuando cual puedo puede pasa paso pasar hago hice quiero cuando siempre nunca aparece sale solo todo todos algo cosa fallo error bug problema servidor juego sampcity tengo tiene tienen estoy estaba funciona funcionar nada porque siguiente".split(" "),
);

/** Palabras clave (raíz de 5 letras) de un texto. */
function stems(text) {
  const out = new Set();
  for (const w of norm(text).split(" ")) {
    if (w.length < 3 || STOP.has(w)) continue;
    out.add(w.startsWith("/") ? w : w.slice(0, 5));
  }
  return out;
}

const shared = (a, b) => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
};

const textOf = (answers) => answers.map((a) => a.value).join(" ");
const whereOf = (answers) => String(answers[0]?.value || ""); // en "bug" el primer campo es "¿Dónde pasa?"

/** Parecido entre dos reportes: 0 a 1, más el número de palabras compartidas. */
function similarity(answersA, answersB) {
  const a = stems(textOf(answersA));
  const b = stems(textOf(answersB));
  if (a.size < 2 || b.size < 2) return { score: 0, shared: 0 };
  const n = shared(a, b);
  const score = n / Math.min(a.size, b.size);
  // mismo comando o lugar en "¿Dónde pasa?" y algo más en común: casi seguro es lo mismo
  const sameWhere = norm(whereOf(answersA)) !== "" && norm(whereOf(answersA)) === norm(whereOf(answersB));
  if (sameWhere && n >= 2) return { score: Math.max(score, MIN_SCORE), shared: Math.max(n, MIN_SHARED) };
  return { score, shared: n };
}

const safe = (s, max = 60) =>
  String(s ?? "")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[correo]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b/g, "[ip]")
    .replace(/[`*_~|>@#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function parseAnswers(json) {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v.filter((a) => a && typeof a.value === "string") : [];
  } catch {
    return [];
  }
}

/** Reportes recientes parecidos a este (de otras personas). */
async function find(guildId, userId, answers, now = Date.now()) {
  if (!enabled() || !answers?.length) return [];
  const since = now - days() * 86400000;
  let rows = [];
  try {
    rows = await Info.find({ Guild: guildId, type: "bug", openedAt: { $gte: new Date(since) } });
  } catch {
    return [];
  }
  const found = [];
  for (const t of rows) {
    if (!t.openedAt || t.creator === userId) continue;
    const opened = new Date(t.openedAt).getTime();
    if (opened < since) continue;
    const { score, shared: n } = similarity(answers, parseAnswers(t.answers));
    if (n >= MIN_SHARED && score >= MIN_SCORE) found.push({ info: t, score, opened });
  }
  return found.sort((x, y) => y.score - x.score || y.opened - x.opened).slice(0, MAX_SHOWN);
}

const ticketNum = (t) => String(t.TicketID).padStart(4, "0");

function ago(ms) {
  const d = Math.floor(ms / 86400000);
  if (d >= 1) return `hace ${d} día${d === 1 ? "" : "s"}`;
  const h = Math.floor(ms / 3600000);
  return h >= 1 ? `hace ${h} h` : "hace un momento";
}

function describe(match, now = Date.now()) {
  const t = match.info;
  const state = t.closedAt ? "cerrado" : "abierto";
  const where = safe(parseAnswers(t.answers)[0]?.value);
  return `• **#${ticketNum(t)}** · ${state} · ${ago(now - match.opened)}${where ? ` · «${where}»` : ""}`;
}

/** Texto para el embed del ticket cuando el usuario decidió abrirlo igualmente. */
const dupText = (nums) => nums.map((n) => `#${n}`).join(", ");

function remember(guildId, userId, data) {
  for (const [k, v] of PENDING) if (Date.now() - v.at > PENDING_MS) PENDING.delete(k);
  PENDING.set(`${guildId}:${userId}`, { ...data, at: Date.now() });
}

/** Mensaje (solo para quien lo escribió) con los parecidos y los dos botones. */
function prompt(matches, now = Date.now()) {
  const list = matches.map((m) => describe(m, now)).join("\n");
  return {
    content:
      `🔎 **Puede que ya esté reportado.** Encontré ${matches.length === 1 ? "un reporte parecido" : "reportes parecidos"} de los últimos ${days()} días:\n${list}\n\n` +
      (matches.every((m) => m.info.closedAt)
        ? "Esos tickets ya están cerrados, así que puede que el fallo ya esté resuelto. Si te sigue pasando igual, abre tu ticket y lo indicamos."
        : "Si es lo mismo, no hace falta que abras otro: el staff ya lo tiene. Si tu caso es distinto, abre tu ticket."),
    components: [
      new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder().setCustomId("Bot_tp_dup:skip").setLabel("Es lo mismo").setEmoji("✅").setStyle(Discord.ButtonStyle.Success),
        new Discord.ButtonBuilder().setCustomId("Bot_tp_dup:open").setLabel("Es distinto, abrir mi ticket").setEmoji("🐞").setStyle(Discord.ButtonStyle.Secondary),
      ),
    ],
  };
}

/** Botones "Es lo mismo" / "Es distinto". Devuelve true si la interacción era de aquí. */
async function handle(client, interaction, openTicket) {
  const id = interaction.customId || "";
  if (!id.startsWith("Bot_tp_dup:")) return false;
  const key = `${interaction.guild.id}:${interaction.user.id}`;
  const pending = PENDING.get(key);
  if (!pending || Date.now() - pending.at > PENDING_MS) {
    PENDING.delete(key);
    await interaction.update({ content: "Esto caducó. Vuelve a abrir el formulario desde el panel de tickets.", components: [] }).catch(() => {});
    return true;
  }
  PENDING.delete(key);
  if (id === "Bot_tp_dup:skip") {
    await interaction.update({ content: "👍 Perfecto, el staff ya tiene ese reporte. Si descubres algo nuevo, abre un ticket con los detalles.", components: [] }).catch(() => {});
    return true;
  }
  await interaction.update({ content: "Abriendo tu ticket…", components: [] }).catch(() => {});
  await openTicket(client, interaction, { typeKey: pending.typeKey, answers: pending.answers, dupOf: pending.dupOf });
  return true;
}

module.exports = { enabled, find, prompt, remember, handle, dupText, ticketNum, _internals: { similarity, stems, norm, PENDING } };
