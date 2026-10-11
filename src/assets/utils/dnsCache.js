/*
 * Caché de DNS para todo el proceso (12-oct-2026).
 *
 * El DNS del hosting falla a ratos (getaddrinfo EAI_AGAIN discord.com) o tarda segundos. Cada conexión nueva a Discord
 * (responder un comando, webhooks) pasa por dns.lookup; si la consulta tarda más de 3 s, Discord da el comando por perdido
 * (10062 Unknown interaction, "La aplicación no respondió").
 *
 * Aquí dns.lookup (lo usan net, tls, undici, fetch y discord.js) responde al momento con la última dirección conocida y la
 * renueva por detrás. Si el sistema falla, se pregunta directo a servidores DNS públicos (c-ares, sin pasar por el resolvedor
 * del hosting). Las direcciones se guardan en .cache/dns.json para que tras un reinicio no haga falta el DNS para arrancar.
 */
const dns = require("dns");
const fs = require("fs");
const path = require("path");

if (dns.lookup.__cache) return;

const FILE = path.join(process.cwd(), ".cache", "dns.json");
const FRESH = 5 * 60 * 1000; // pasado esto se renueva por detrás (se sigue usando la vieja mientras tanto)
const SYSTEM_TIMEOUT = 1500; // si el sistema no contesta en 1,5 s se prueba con los DNS públicos
const WARM = ["discord.com", "gateway.discord.gg", "cdn.discordapp.com", "media.discordapp.net"];

const original = dns.lookup;
const publicResolver = new dns.Resolver({ timeout: 1500, tries: 2 });
publicResolver.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4"]);

/** host -> { addrs: [{address, family}], at } */
const cache = new Map();
const inflight = new Map();

try {
  const saved = JSON.parse(fs.readFileSync(FILE, "utf8"));
  for (const [host, e] of Object.entries(saved)) {
    if (Array.isArray(e.addrs) && e.addrs.length) cache.set(host, { addrs: e.addrs, at: 0 }); // at 0 = renovar en cuanto se use
  }
} catch {}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(Object.fromEntries([...cache].map(([h, e]) => [h, { addrs: e.addrs }]))));
    } catch {}
  }, 2000);
  saveTimer.unref?.();
}

const isIp = (h) => /^[\d.]+$/.test(h) || h.includes(":");

function systemLookup(host) {
  return new Promise((resolve, reject) => {
    original.call(dns, host, { all: true }, (err, addrs) => (err ? reject(err) : resolve(addrs)));
  });
}

function publicLookup(host) {
  return new Promise((resolve, reject) => {
    publicResolver.resolve4(host, (err, a4) => {
      if (!err && a4.length) return resolve(a4.map((address) => ({ address, family: 4 })));
      publicResolver.resolve6(host, (err6, a6) => {
        if (!err6 && a6.length) return resolve(a6.map((address) => ({ address, family: 6 })));
        reject(err || err6);
      });
    });
  });
}

/** Resuelve de verdad: el sistema primero; si falla o tarda más de 1,5 s, los DNS públicos (gana el primero que conteste). */
function resolveFresh(host) {
  if (inflight.has(host)) return inflight.get(host);
  const p = new Promise((resolve, reject) => {
    let done = false, fails = 0, lastErr;
    const ok = (addrs) => {
      if (done) return;
      done = true;
      cache.set(host, { addrs, at: Date.now() });
      save();
      resolve(addrs);
    };
    const fail = (err) => {
      lastErr = err;
      if (++fails === 2 && !done) { done = true; reject(lastErr); }
    };
    let publicStarted = false;
    const startPublic = () => {
      if (publicStarted) return;
      publicStarted = true;
      publicLookup(host).then(ok, fail);
    };
    systemLookup(host).then(ok, (err) => { fail(err); startPublic(); });
    setTimeout(startPublic, SYSTEM_TIMEOUT).unref?.();
  }).finally(() => inflight.delete(host));
  inflight.set(host, p);
  return p;
}

function pick(addrs, options) {
  let list = addrs;
  if (options.family === 4 || options.family === 6) list = addrs.filter((a) => a.family === options.family);
  if (!list.length) return null;
  return list;
}

function cachedLookup(host, options, callback) {
  if (typeof options === "function") { callback = options; options = {}; }
  else if (typeof options === "number") options = { family: options };
  else options = options || {};

  if (!host || isIp(host) || host === "localhost") return original.call(dns, host, options, callback);

  const answer = (addrs) => {
    const list = pick(addrs, options);
    if (!list) return original.call(dns, host, options, callback);
    if (options.all) return process.nextTick(callback, null, list);
    process.nextTick(callback, null, list[0].address, list[0].family);
  };

  const hit = cache.get(host);
  if (hit) {
    if (Date.now() - hit.at > FRESH) resolveFresh(host).catch(() => {}); // renovar por detrás, sin esperar
    return answer(hit.addrs);
  }
  resolveFresh(host).then(answer, (err) => process.nextTick(callback, err));
}
cachedLookup.__cache = cache;
dns.lookup = cachedLookup;

// Dejar listas las direcciones de Discord desde el arranque (y renovarlas cada tanto)
const warm = () => { for (const h of WARM) resolveFresh(h).catch(() => {}); };
warm();
setInterval(warm, FRESH).unref?.();

module.exports = { cache, resolveFresh };
