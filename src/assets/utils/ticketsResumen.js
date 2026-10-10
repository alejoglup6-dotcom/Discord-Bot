/*
 * Resumen semanal de tickets para el staff.
 *
 * Una vez por semana se publica un embed en el canal de registros de tickets (el de /setup tickets) con:
 * lo abierto y cerrado frente a la semana anterior, primera respuesta, valoración media, tickets sin atender,
 * valoraciones bajas, temas repetidos (categorías de la IA y fallos que se repiten), lo que la IA resolvió sola y
 * las preguntas que la IA no supo contestar (huecos de la guía). Todo sale de la base de datos: no usa IA.
 *
 *   TICKETS_RESUMEN=0          lo apaga
 *   TICKETS_RESUMEN_DIA=1      día de envío (0 = domingo … 6 = sábado; por defecto lunes)
 *   TICKETS_RESUMEN_HORA=9     hora desde la que se envía (hora del servidor donde corre el bot)
 *   TICKETS_RESUMEN_PRUEBA=1   envía uno al arrancar, sin esperar al día (quítalo después de probar)
 */
const Info = require("../../database/models/ticketInfo");

const DAY = 86400000;
const TITLE = "RESUMEN SEMANAL DE TICKETS";

const enabled = () => !/^(0|off|no|false)$/i.test(String(process.env.TICKETS_RESUMEN ?? "1").trim());
const num = (k, def) => {
  const v = parseFloat(process.env[k]);
  return Number.isFinite(v) ? v : def;
};

const t = (d) => (d ? new Date(d).getTime() : 0);
const pad = (n) => String(n).padStart(4, "0");
const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function firstAnswer(info) {
  try {
    const a = JSON.parse(info.answers || "[]");
    return String(a[0]?.value || "");
  } catch {
    return "";
  }
}

/** Cálculo puro (sin Discord): filas de ticketInfo + huecos de la IA -> datos del resumen. */
function compute(rows, gaps = [], now = Date.now(), days = 7) {
  const from = now - days * DAY;
  const prev = from - days * DAY;
  const opened = rows.filter((r) => t(r.openedAt) >= from && t(r.openedAt) <= now);
  const openedPrev = rows.filter((r) => t(r.openedAt) >= prev && t(r.openedAt) < from);
  const closed = rows.filter((r) => t(r.closedAt) >= from && t(r.closedAt) <= now);
  const closedPrev = rows.filter((r) => t(r.closedAt) >= prev && t(r.closedAt) < from);

  const waits = opened.filter((r) => r.claimedAt).map((r) => (t(r.claimedAt) - t(r.openedAt)) / 60000).filter((m) => m >= 0);
  const rated = closed.filter((r) => r.rating);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;

  // Sin atender: abiertos desde hace más de 24 h y nadie los reclamó (la IA no cuenta como atención)
  const pending = rows
    .filter((r) => !r.closedAt && !r.claimedBy && now - t(r.openedAt) > DAY)
    .sort((a, b) => t(a.openedAt) - t(b.openedAt));

  const lowRatings = rated.filter((r) => r.rating <= 2);

  const byCategory = {};
  for (const r of opened) if (r.aiCategory) byCategory[r.aiCategory] = (byCategory[r.aiCategory] || 0) + 1;

  // Fallos que se repiten: mismo "¿Dónde pasa?" en 2 o más tickets de la semana
  const bugWhere = new Map();
  for (const r of opened.filter((x) => x.type === "bug")) {
    const k = norm(firstAnswer(r));
    if (k.length < 3) continue;
    const e = bugWhere.get(k) || { label: firstAnswer(r).slice(0, 60), n: 0 };
    e.n++;
    bugWhere.set(k, e);
  }
  const repeatedBugs = [...bugWhere.values()].filter((e) => e.n >= 2).sort((a, b) => b.n - a.n).slice(0, 5);

  const byType = {};
  for (const r of opened) byType[r.type] = (byType[r.type] || 0) + 1;

  const aiHandled = opened.filter((r) => r.aiHandled);
  const ai = {
    handled: aiHandled.length,
    resolved: aiHandled.filter((r) => r.aiState === "done" && !r.claimedBy).length,
    toStaff: aiHandled.filter((r) => r.aiState === "staff").length,
  };

  const newGaps = gaps.filter((g) => (g.At || 0) >= from).sort((a, b) => (b.Count || 0) - (a.Count || 0)).slice(0, 5);

  return {
    days,
    opened: opened.length,
    openedPrev: openedPrev.length,
    closed: closed.length,
    closedPrev: closedPrev.length,
    stillOpen: rows.filter((r) => !r.closedAt).length,
    firstResponseMin: median(waits),
    avg,
    rated: rated.length,
    pending,
    lowRatings,
    byType,
    byCategory,
    repeatedBugs,
    ai,
    gaps: newGaps,
  };
}

const arrow = (now, before) => (now === before ? "=" : now > before ? `▲ ${now - before}` : `▼ ${before - now}`);

function mins(m) {
  if (!m) return "—";
  return m >= 120 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`;
}

/** Datos -> campos del embed (texto plano, sin Discord). */
function toFields(r, typeLabel = (k) => k) {
  const f = [];
  f.push({ name: "Abiertos", value: `**${r.opened}** (${arrow(r.opened, r.openedPrev)} vs semana anterior)`, inline: true });
  f.push({ name: "Cerrados", value: `**${r.closed}** (${arrow(r.closed, r.closedPrev)})`, inline: true });
  f.push({ name: "Siguen abiertos", value: `**${r.stillOpen}**`, inline: true });
  f.push({ name: "Primera respuesta (mediana)", value: mins(r.firstResponseMin), inline: true });
  f.push({ name: "Valoración media", value: r.rated ? `${r.avg.toFixed(1)} ★ (${r.rated})` : "Sin valoraciones", inline: true });

  const types = Object.entries(r.byType).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${typeLabel(k)}: **${n}**`).join(" · ");
  if (types) f.push({ name: "Por tipo", value: types.slice(0, 1000) });

  if (r.pending.length) {
    const list = r.pending.slice(0, 5).map((p) => `• #${pad(p.TicketID)} ${typeLabel(p.type)} · <#${p.channelID}> · ${Math.floor((Date.now() - t(p.openedAt)) / 3600000)} h`).join("\n");
    f.push({ name: `⏳ Sin atender (más de 24 h): ${r.pending.length}`, value: list.slice(0, 1000) });
  }
  if (r.lowRatings.length) {
    const list = r.lowRatings.slice(0, 5).map((p) => `• #${pad(p.TicketID)} ${typeLabel(p.type)} · ${"★".repeat(p.rating)} ${p.claimedBy ? `· atendió <@${p.claimedBy}>` : "· sin staff"}`).join("\n");
    f.push({ name: `😕 Valoraciones bajas: ${r.lowRatings.length}`, value: list.slice(0, 1000) });
  }

  const topics = [];
  const cats = Object.entries(r.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (cats.length) topics.push(`Temas: ${cats.map(([k, n]) => `${k} **${n}**`).join(" · ")}`);
  if (r.repeatedBugs.length) topics.push(`Fallos repetidos: ${r.repeatedBugs.map((b) => `«${b.label}» ×${b.n}`).join(" · ")}`);
  if (topics.length) f.push({ name: "🔁 Qué se repite", value: topics.join("\n").slice(0, 1000) });

  f.push({
    name: "🤖 IA",
    value: r.ai.handled
      ? `Contestó en **${r.ai.handled}** · resueltos sin staff **${r.ai.resolved}** · pidieron al staff **${r.ai.toStaff}**`
      : "No contestó en ningún ticket esta semana",
  });
  if (r.gaps.length) {
    f.push({ name: "📚 Lo que falta en la guía", value: r.gaps.map((g) => `• «${String(g.Question || "").slice(0, 80)}» ×${g.Count || 1}`).join("\n").slice(0, 1000) });
  }
  return f;
}

async function report(guildId, days = 7) {
  const rows = await Info.find({ Guild: guildId });
  let gaps = [];
  try {
    gaps = await require("./iaCorrecciones").topGaps(guildId, 50);
  } catch {}
  return compute(rows, gaps, Date.now(), days);
}

async function alreadySent(channel, now = Date.now()) {
  const msgs = await channel.messages.fetch({ limit: 40 }).catch(() => null);
  if (!msgs) return false;
  return msgs.some((m) => m.author?.bot && m.embeds?.some((e) => String(e.title || "").startsWith(TITLE)) && now - m.createdTimestamp < 6 * DAY);
}

async function send(client, guild, config, { force = false } = {}) {
  const channel = config?.Logs && guild.channels.cache.get(config.Logs);
  if (!channel) return false;
  if (!force && (await alreadySent(channel))) return false;
  const { BY_KEY } = require("../data/tickets");
  const { brandEmbed } = require("./brand");
  const r = await report(guild.id, 7);
  const embed = brandEmbed(guild, { title: TITLE, desc: "Últimos 7 días frente a los 7 anteriores.", fields: toFields(r, (k) => `${BY_KEY.get(k)?.emoji || "🎫"} ${BY_KEY.get(k)?.label || k}`) });
  await channel.send({ embeds: [embed] });
  return true;
}

let testDone = false;

/** Se llama desde el barrido de tickets (cada 15 min): envía el resumen si toca y no se envió ya. */
async function tick(client, now = new Date()) {
  if (!enabled()) return;
  const test = /^(1|on|si|true)$/i.test(String(process.env.TICKETS_RESUMEN_PRUEBA || ""));
  const due = now.getDay() === num("TICKETS_RESUMEN_DIA", 1) && now.getHours() >= num("TICKETS_RESUMEN_HORA", 9);
  if (!due && !(test && !testDone)) return;
  testDone = true;
  const Tickets = require("../../database/models/tickets");
  for (const guild of client.guilds.cache.values()) {
    const config = await Tickets.findOne({ Guild: guild.id }).catch(() => null);
    if (!config) continue;
    await send(client, guild, config, { force: test && !due }).catch((e) => console.log("[tickets] resumen:", e.message));
  }
}

module.exports = { enabled, compute, toFields, report, send, tick, TITLE };
