/*
 * Datos en vivo del servidor para la IA (solo lectura, consultas fijas).
 *
 * La IA NUNCA escribe SQL: este archivo tiene un puñado de consultas SELECT escritas a mano y solo se ejecutan cuando
 * la pregunta lo pide ("cuántos conectados hay", "qué staff hay", "cuántas facciones", "mi nivel"...). Al modelo solo
 * le llega el resultado. No se consulta ni se entrega: contraseñas, IPs, correos, teléfonos ni datos de otros jugadores
 * (solo nombre y nivel de quien está conectado, que ya se ve en el juego).
 *
 *   IA_ENVIVO=off          desactiva todo esto
 *   IA_MYSQL_URL=mysql://usuario_solo_lectura:clave@host:3306/base   (opcional) usuario de MySQL con solo SELECT
 */
const CACHE_MS = 20 * 1000;
const cache = new Map();
let roPool = null;

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim();

async function query(sql, params) {
  if (process.env.IA_MYSQL_URL) {
    if (!roPool) roPool = require("mysql2/promise").createPool({ uri: process.env.IA_MYSQL_URL, charset: "utf8mb4", connectionLimit: 2, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true });
    const [rows] = await roPool.query(sql, params);
    return rows;
  }
  return require("../../database/mysql").query(sql, params);
}

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

const money = (n) => "$" + Number(n || 0).toLocaleString("es-CO");
const hours = (sec) => Math.floor(Number(sec || 0) / 3600);

// Igual que ADMIN_LEVELS de database/samp.js
const RANGOS = ["Ciudadano", "Soporte", "Ayudante", "Moderador", "Moderador Global", "Administrador", "Encargado de Staff", "Desarrollador", "Co-Fundador", "Fundador"];

async function online() {
  return cached("online", async () => {
    const rows = await query("SELECT name, level, admin_level FROM player WHERE connected = 1 ORDER BY level DESC, name LIMIT 60");
    const staff = rows.filter((r) => Number(r.admin_level) > 0);
    const list = rows.slice(0, 25).map((r) => `${r.name} (nivel ${r.level})`).join(", ");
    return { n: rows.length, staff, list };
  });
}

async function totals() {
  return cached("totals", async () => {
    const [r] = await query("SELECT COUNT(*) AS cuentas, SUM(connected = 1) AS conectados FROM player");
    return { cuentas: Number(r.cuentas), conectados: Number(r.conectados || 0) };
  });
}

async function crews() {
  return cached("crews", () =>
    query("SELECT c.name, COUNT(p.id) AS miembros, COALESCE(SUM(p.connected = 1), 0) AS conectados FROM crews c LEFT JOIN player p ON p.crew = c.id GROUP BY c.id, c.name ORDER BY miembros DESC, c.name LIMIT 30"),
  );
}

async function ownAccount(discordId) {
  const samp = require("../../database/samp");
  const p = await samp.getLinkedPlayer(discordId);
  if (!p) return null;
  return p;
}

/**
 * Texto con datos en vivo relacionados con la pregunta ("" si no aplica o si no se puede consultar).
 * @param {string} question
 * @param {string} [discordId] quien pregunta (para "mi nivel", "mi dinero"...)
 */
async function getLive(question, discordId) {
  if (/^(off|no|false|0)$/i.test(String(process.env.IA_ENVIVO || "").trim())) return "";
  const q = norm(question);
  const wantsOnline = /conectad|online|en linea|jugando|conectados|cuanta gente|cuantos jugadores|hay gente|jugadores activos/.test(q);
  const wantsStaff = /\b(staff|admins?|administradores?|moderadores?|soportes?|ayudantes?)\b/.test(q) && /conectad|online|hay|disponible|conectados|ahora/.test(q);
  const wantsTotals = /cuantas cuentas|cuantos (jugadores )?(registrados|hay registrados)|registrados|cuentas creadas|cuantos usuarios/.test(q);
  const wantsCrews = /\b(crews?|facciones?|bandas?|pandillas?|mafias?)\b/.test(q) && /cuant|miembros|hay|lista|cuales|activ/.test(q);
  // Primera persona ("mi nivel", "cuánto dinero tengo", "qué nivel soy", "cuántas horas llevo") + un dato de la cuenta
  const mineSubject = /\b(nivel|dinero|plata|efectivo|banco|cuenta|horas|tiempo jugado|stats|estadisticas|crew|faccion|vip|coins|saldo|cash|lana|reputacion)\b/.test(q);
  const mineVerb = /\b(mi|mis|tengo|soy|llevo|estoy|tenia|poseo)\b/.test(q);
  const wantsMine = mineSubject && mineVerb;
  if (!(wantsOnline || wantsStaff || wantsTotals || wantsCrews || wantsMine)) return "";

  try {
    const samp = require("../../database/samp");
    if (!(await samp.isAvailable())) return "";
    const parts = [];

    if (wantsOnline || wantsStaff) {
      const o = await online();
      if (wantsOnline) {
        parts.push(`Jugadores conectados ahora mismo en el servidor de juego: ${o.n}${o.n ? `. Conectados: ${o.list}${o.n > 25 ? " y más" : ""}` : ""}.`);
      }
      if (wantsStaff || wantsOnline) {
        parts.push(
          o.staff.length
            ? `Staff conectado ahora: ${o.staff.length} (${o.staff.map((s) => `${s.name} - ${RANGOS[Number(s.admin_level)] || "Staff"}`).join(", ")}).`
            : "Staff conectado ahora: ninguno.",
        );
      }
    }
    if (wantsTotals) {
      const t = await totals();
      parts.push(`Cuentas registradas en el servidor: ${t.cuentas.toLocaleString("es-CO")} (conectadas ahora: ${t.conectados}).`);
    }
    if (wantsCrews) {
      const c = await crews();
      parts.push(c.length ? `Crews/facciones (${c.length}): ${c.map((x) => `${x.name} (${x.miembros} miembros, ${x.conectados} conectados)`).join("; ")}.` : "No hay crews registradas.");
    }
    if (wantsMine && discordId) {
      const p = await ownAccount(discordId);
      parts.push(
        p
          ? `CUENTA VINCULADA DE QUIEN PREGUNTA (solo se la puedes decir a esa persona): ${p.name}, nivel ${p.level}, ${hours(p.time_playing)} horas jugadas, efectivo ${money(p.cash)}, banco ${money(p.bank_money)}${p.crew_name ? `, crew ${p.crew_name}` : ""}${Number(p.vip) > 0 ? ", VIP activo" : ""}, ${p.coins ?? 0} coins.`
          : "Quien pregunta NO tiene una cuenta de juego vinculada con Discord: dile que use /vincular para ver sus datos.",
      );
    }
    return parts.length ? parts.join("\n") : "";
  } catch (err) {
    console.log("IA en vivo:", err.message);
    return "";
  }
}

function reset() {
  cache.clear();
}

module.exports = { getLive, _internals: { reset, norm } };
