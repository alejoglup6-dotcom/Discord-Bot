/*
 * /juego (comandos del juego para el Fundador) contra una copia de la base de datos del servidor. Un "gamemode" falso
 * marca las acciones como hechas, como hace discord_link.pwn cada 5 segundos.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const db = require("../src/database/mysql");
const samp = require("../src/database/samp");
const juego = require("../src/assets/utils/juego");

const out = [];
const client = {
  errNormal: async (o) => out.push({ error: o.error }),
  succNormal: async (o) => out.push({ ok: o.text, fields: o.fields }),
  embed: async (o) => out.push({ embed: o }),
};
require("../src/handlers/functions/samp")(client);

const FOUNDER_DISCORD = "900000000000000011";
const ADMIN_DISCORD = "900000000000000012";

function interaction(userId, sub, opts = {}) {
  return {
    user: { id: userId },
    options: {
      getSubcommand: () => sub,
      getString: (k) => opts[k] ?? null,
      getInteger: (k) => opts[k] ?? null,
    },
  };
}
const run = async (userId, sub, opts) => {
  out.length = 0;
  await juego.run(client, interaction(userId, sub, opts));
  return out[out.length - 1];
};
const lastAction = async () => (await db.query("SELECT * FROM discord_actions WHERE id > ? ORDER BY id DESC LIMIT 1", [before]))[0];

let founder, admin, target, before, gameTimer;

test.before(async () => {
  assert.ok(await samp.init(), "la base de datos de prueba necesita la tabla player");
  const rows = await db.query("SELECT id, name, admin_level, connected, playerid, bank_account FROM player ORDER BY id LIMIT 3");
  [founder, admin, target] = rows;
  before = (await db.query("SELECT COALESCE(MAX(id), 0) AS id FROM discord_actions"))[0].id;
  await db.query("UPDATE player SET admin_level = 9 WHERE id = ?", [founder.id]);
  await db.query("UPDATE player SET admin_level = 8 WHERE id = ?", [admin.id]);
  await db.query("UPDATE player SET admin_level = 0, connected = 0 WHERE id = ?", [target.id]);
  await db.query("DELETE FROM discord_links WHERE discord_id IN (?, ?) OR player_id IN (?, ?)", [FOUNDER_DISCORD, ADMIN_DISCORD, founder.id, admin.id]);
  await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?), (?, ?)", [founder.id, FOUNDER_DISCORD, admin.id, ADMIN_DISCORD]);
  // el gamemode falso: marca como hechas las acciones nuevas
  gameTimer = setInterval(() => db.query("UPDATE discord_actions SET done = 1 WHERE id > ? AND done = 0", [before]).catch(() => {}), 200);
});

test.after(async () => {
  clearInterval(gameTimer);
  await db.query("DELETE FROM discord_actions WHERE id > ?", [before]);
  await db.query("DELETE FROM discord_links WHERE discord_id IN (?, ?)", [FOUNDER_DISCORD, ADMIN_DISCORD]);
  for (const p of [founder, admin, target]) {
    await db.query("UPDATE player SET admin_level = ?, connected = ?, playerid = ?, bank_account = ? WHERE id = ?", [
      p.admin_level, p.connected, p.playerid, p.bank_account, p.id,
    ]);
  }
  await db.close();
});

test("el comando se puede registrar en Discord (máximo 25 subcomandos)", () => {
  const json = require("../src/interactions/Command/juego").data.toJSON();
  assert.ok(json.options.length <= 25, `${json.options.length} subcomandos`);
  assert.ok(json.options.every((o) => /^[a-z]{1,32}$/.test(o.name)));
});

test("solo el Fundador", async () => {
  assert.match((await run("555", "dinero", { name: target.name, cantidad: 100 })).error, /vincula/);
  assert.match((await run(ADMIN_DISCORD, "dinero", { name: target.name, cantidad: 100 })).error, /Fundador/);
  assert.ok((await run(FOUNDER_DISCORD, "help")).embed);
});

test("dinero, nivel, staff y skin dejan la acción para el gamemode y esperan a que la aplique", async () => {
  let r = await run(FOUNDER_DISCORD, "dinero", { name: target.name, cantidad: -2500 });
  assert.match(r.ok, /Pierde \$2\.500 en mano/);
  assert.strictEqual(r.fields[0].value, "Aplicado");
  let a = await lastAction();
  assert.deepStrictEqual([a.player_id, a.action, a.value, a.by_name], [target.id, "cash", -2500, founder.name]);

  assert.match((await run(FOUNDER_DISCORD, "dinero", { name: target.name, cantidad: 0 })).error, /no puede ser 0/);
  await run(FOUNDER_DISCORD, "nivel", { name: target.name, nivel: 12 });
  assert.deepStrictEqual([(a = await lastAction()).action, a.value], ["setlevel", 12]);
  r = await run(FOUNDER_DISCORD, "staff", { name: target.name, rango: 5 });
  assert.match(r.ok, /Administrador/);
  assert.deepStrictEqual([(a = await lastAction()).action, a.value], ["setadmin", 5]);
  await run(FOUNDER_DISCORD, "skin", { name: target.name, skin: 280 });
  assert.deepStrictEqual([(a = await lastAction()).action, a.value], ["skin", 280]);
  // vip: by_name es el nombre de la cuenta (el gamemode espera si el jugador está entrando)
  await run(FOUNDER_DISCORD, "vip", { name: target.name, dias: 30 });
  assert.deepStrictEqual([(a = await lastAction()).action, a.value, a.by_name], ["vip", 30, target.name]);
});

test("banco: necesita cuenta", async () => {
  await db.query("UPDATE player SET bank_account = 0 WHERE id = ?", [target.id]);
  assert.match((await run(FOUNDER_DISCORD, "banco", { name: target.name, cantidad: 100 })).error, /cuenta del banco/);
  await db.query("UPDATE player SET bank_account = 123456 WHERE id = ?", [target.id]);
  assert.ok((await run(FOUNDER_DISCORD, "banco", { name: target.name, cantidad: 100 })).ok);
});

test("nombre: formato y que no lo use otra cuenta", async () => {
  assert.match((await run(FOUNDER_DISCORD, "nombre", { name: target.name, nuevo: "sin guion" })).error, /Nombre_Apellido/);
  const [taken] = await db.query("SELECT name FROM player WHERE id <> ? AND name REGEXP '^[A-Za-z]{2,}_[A-Za-z]{2,}$' AND CHAR_LENGTH(name) <= 23 LIMIT 1", [target.id]);
  assert.match((await run(FOUNDER_DISCORD, "nombre", { name: target.name, nuevo: taken.name })).error, /ya lo usa otra cuenta/);
  await run(FOUNDER_DISCORD, "nombre", { name: target.name, nuevo: "Nuevo_Nombre" });
  const a = await lastAction();
  assert.deepStrictEqual([a.action, a.reason], ["setname", "Nuevo_Nombre"]);
});

test("clave: llega como salt:hash igual que SHA256_PassHash del juego, nunca en claro", async () => {
  assert.match((await run(FOUNDER_DISCORD, "clave", { name: target.name, nueva: "123" })).error, /6 a 18/);
  const r = await run(FOUNDER_DISCORD, "clave", { name: target.name, nueva: "Clave123" });
  assert.strictEqual(r.ok.includes("Clave123"), false);
  const a = await lastAction();
  assert.strictEqual(a.action, "setpass");
  assert.strictEqual(a.reason.includes("Clave123"), false);
  const [salt, hash] = a.reason.split(":");
  assert.match(salt, /^[A-Za-z0-9]{10}$/);
  assert.strictEqual(hash, crypto.createHash("sha256").update("Clave123" + salt).digest("hex").toUpperCase());
  // valor comprobado con SHA256_PassHash en open.mp
  assert.strictEqual(juego.hashPass("Clave123", "abcDEF1234").hash, "4FB269192B920B5061B1CD937C1602A176EE9E6DEB52399B05BF749618A6CC2E");
});

test("facción: rango dentro del máximo", async () => {
  assert.match((await run(FOUNDER_DISCORD, "faccion", { name: target.name, faccion: 6, rango: 5 })).error, /de 1 a 4/);
  await run(FOUNDER_DISCORD, "faccion", { name: target.name, faccion: 1, rango: 12 });
  const a = await lastAction();
  assert.deepStrictEqual([a.action, a.value, a.reason], ["setfact", 1, "12"]);
});

test("los de ahora (vida, armas, expulsar) piden que esté conectado", async () => {
  assert.match((await run(FOUNDER_DISCORD, "vida", { name: target.name, valor: 100 })).error, /no está conectado/);
  await db.query("UPDATE player SET connected = 1, playerid = 4 WHERE id = ?", [target.id]);
  const r = await run(FOUNDER_DISCORD, "arma", { name: target.name, arma: 24, balas: 50 });
  assert.strictEqual(r.fields[0].value, "Aplicado (está conectado)");
  const a = await lastAction();
  assert.deepStrictEqual([a.action, a.value, a.reason], ["weapon", 24, "50"]);
  await run(FOUNDER_DISCORD, "expulsar", { name: target.name, razon: "pruebas" });
  assert.match((await lastAction()).reason, /expulsado por .*\nRazon: pruebas/);
  await db.query("UPDATE player SET connected = 0 WHERE id = ?", [target.id]);
});

test("anuncio a todo el servidor", async () => {
  await run(FOUNDER_DISCORD, "anuncio", { mensaje: "Reinicio en 5 minutos" });
  const a = await lastAction();
  assert.deepStrictEqual([a.player_id, a.action, a.reason], [0, "anuncio", "Reinicio en 5 minutos"]);
});

test("si el servidor no responde, queda en cola", async () => {
  clearInterval(gameTimer);
  const id = await samp.queueGameAction(target.id, "skin", 1, "", founder.name);
  assert.strictEqual(await samp.waitAction(id, 300, 100), false);
});
