/*
 * Pruebas de los comandos /samp contra una copia de la base de datos del servidor (s107_Samp.sql cargado).
 * Usan un cliente y una interacción falsos: no hace falta Discord.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const db = require("../src/database/mysql");
const samp = require("../src/database/samp");
const { loadImage, createCanvas } = require("canvas");

const out = [];
const client = {
  errNormal: async (o) => out.push({ error: o.error }),
  succNormal: async (o) => out.push({ ok: o.text, fields: o.fields }),
  embed: async (o) => out.push({ embed: o }),
  createLeaderboard: async (title, lb) => out.push({ title, lb }),
};
require("../src/handlers/functions/samp")(client);

function interaction(userId, opts = {}) {
  return {
    user: { id: userId, username: "u" + userId, toString: () => `<@${userId}>` },
    followUps: [],
    followUp(m) {
      this.followUps.push(m);
    },
    options: {
      getString: (k) => opts[k] ?? null,
      getInteger: (k) => opts[k] ?? null,
      getUser: (k) => opts[k] ?? null,
    },
  };
}
const run = async (sub, i) => {
  out.length = 0;
  await require(`../src/commands/samp/${sub}`)(client, i, []);
  return out[out.length - 1];
};

let admin, player, before;
const ADMIN_DISCORD = "900000000000000001";
const PLAYER_DISCORD = "900000000000000002";

test.before(async () => {
  assert.ok(await samp.init(), "la base de datos de prueba necesita la tabla player");
  [admin] = await db.query("SELECT id, name FROM player WHERE admin_level >= 4 ORDER BY id LIMIT 1");
  [player] = await db.query("SELECT id, name, admin_level, mute, connected, playerid FROM player WHERE admin_level = 0 ORDER BY id LIMIT 1");
  [admin] = await db.query("SELECT id, name, admin_level FROM player WHERE id = ?", [admin.id]);
  // Para dejar todo como estaba: solo se borran las filas creadas por las pruebas
  const [[b], [h], [a]] = await Promise.all([
    db.query("SELECT COALESCE(MAX(id), 0) AS id FROM bans"),
    db.query("SELECT COALESCE(MAX(id), 0) AS id FROM bad_history"),
    db.query("SELECT COALESCE(MAX(id), 0) AS id FROM discord_actions"),
  ]);
  before = { ban: b.id, history: h.id, action: a.id };
  await db.query("DELETE FROM discord_links WHERE discord_id IN (?, ?)", [ADMIN_DISCORD, PLAYER_DISCORD]);
});

test.after(async () => {
  await db.query("DELETE FROM discord_links WHERE discord_id IN (?, ?)", [ADMIN_DISCORD, PLAYER_DISCORD]);
  await db.query("DELETE FROM discord_link_codes WHERE discord_id IN (?, ?)", [ADMIN_DISCORD, PLAYER_DISCORD]);
  await db.query("DELETE FROM bans WHERE id > ?", [before.ban]);
  await db.query("DELETE FROM bad_history WHERE id > ?", [before.history]);
  await db.query("DELETE FROM discord_actions WHERE id > ?", [before.action]);
  await db.query("UPDATE player SET mute = ?, admin_level = ?, connected = ?, playerid = ? WHERE id = ?", [
    player.mute,
    player.admin_level,
    player.connected,
    player.playerid,
    player.id,
  ]);
  await db.query("UPDATE player SET admin_level = ? WHERE id = ?", [admin.admin_level, admin.id]);
  await db.close();
});

// Lo que hace /vincular en el gamemode (discord_link.pwn)
async function gameLink(code, name) {
  const [row] = await db.query("SELECT discord_id FROM discord_link_codes WHERE code = ? AND player_name = ? AND expires_at > NOW()", [code, name]);
  const [p] = await db.query("SELECT id FROM player WHERE name = ?", [name]);
  await db.query("DELETE FROM discord_links WHERE player_id = ? OR discord_id = ?", [p.id, row.discord_id]);
  await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [p.id, row.discord_id]);
  await db.query("DELETE FROM discord_link_codes WHERE code = ?", [code]);
}

test("vincular cuentas", async () => {
  assert.match((await run("link", interaction(PLAYER_DISCORD, { name: "Nadie_Existe" }))).error, /No existe/);
  const i = interaction(PLAYER_DISCORD, { name: player.name.toLowerCase() });
  assert.ok((await run("link", i)).ok);
  const code = i.followUps[0].content.match(/vincular ([A-Z0-9]{6})/)[1];
  await gameLink(code, player.name);
  assert.match((await run("link", interaction(PLAYER_DISCORD, { name: player.name }))).error, /Ya tienes vinculada/);
  assert.match((await run("link", interaction("123", { name: player.name }))).error, /ya está vinculada a otro/);

  const ia = interaction(ADMIN_DISCORD, { name: admin.name });
  await run("link", ia);
  await gameLink(ia.followUps[0].content.match(/vincular ([A-Z0-9]{6})/)[1], admin.name);
});

test("perfil: el dinero solo lo ven el dueño y el staff", async () => {
  const own = (await run("profile", interaction(PLAYER_DISCORD))).embed;
  assert.ok(own.fields.some((f) => f.name.includes("Efectivo")));
  const other = (await run("profile", interaction("555", { name: player.name }))).embed;
  assert.ok(!other.fields.some((f) => f.name.includes("Efectivo")));
  assert.ok(other.fields.some((f) => f.value === `<@${PLAYER_DISCORD}>`));
  const staff = (await run("profile", interaction(ADMIN_DISCORD, { user: { id: PLAYER_DISCORD } }))).embed;
  assert.ok(staff.fields.some((f) => f.name.includes("Efectivo")));
  assert.match((await run("profile", interaction("555"))).error, /No tienes una cuenta vinculada/);
});

test("perfil: skin guardada si está desconectado, la puesta ahora si está conectado", async () => {
  const [{ skin }] = await db.query("SELECT skin FROM player WHERE id = ?", [player.id]);
  const skinField = (e) => e.fields.find((f) => f.name.includes("Skin"));

  let e = (await run("profile", interaction("555", { name: player.name }))).embed;
  assert.strictEqual(skinField(e).value, String(skin));
  // Foto de la cabeza al pecho generada a partir de la imagen de open.mp
  assert.strictEqual(e.thumbnail, "attachment://skin.png");
  const png = e.files[0].attachment;
  assert.strictEqual(png.subarray(1, 4).toString(), "PNG");
  const img = await loadImage(png);
  assert.deepStrictEqual([img.width, img.height], [256, 256]);
  // Fondo transparente (PNG): la esquina de arriba queda vacía
  const c = createCanvas(256, 256).getContext("2d");
  c.drawImage(img, 0, 0);
  assert.strictEqual(c.getImageData(2, 2, 1, 1).data[3], 0);

  // El gamemode publica la skin del uniforme; solo cuenta mientras está conectado
  await db.query("INSERT INTO discord_live (player_id, skin) VALUES (?, 280) ON DUPLICATE KEY UPDATE skin = 280", [player.id]);
  e = (await run("profile", interaction("555", { name: player.name }))).embed;
  assert.strictEqual(skinField(e).value, String(skin));
  await db.query("UPDATE player SET connected = 1, playerid = 3 WHERE id = ?", [player.id]);
  e = (await run("profile", interaction("555", { name: player.name }))).embed;
  assert.strictEqual(skinField(e).value, "280 (puesta ahora)");
  assert.strictEqual(e.thumbnail, "attachment://skin.png");
  await db.query("UPDATE player SET connected = ?, playerid = ? WHERE id = ?", [player.connected, player.playerid, player.id]);
  await db.query("DELETE FROM discord_live WHERE player_id = ?", [player.id]);

  // Skins personalizadas (más de 311) no tienen imagen en open.mp
  assert.strictEqual(samp.skinImage(20001), null);
  // Si no se puede generar la foto, queda la imagen de cuerpo entero
  const { skinPortrait } = require("../src/assets/utils/skinPortrait");
  await assert.rejects(skinPortrait("https://assets.open.mp/assets/images/skins/99999.png"));
});

test("conectados y tops", async () => {
  await db.query("UPDATE player SET connected = 1, playerid = 7 WHERE id = ?", [player.id]);
  const r = await run("online", interaction("1"));
  assert.ok(r.lb.some((l) => l.includes("7")));
  await db.query("UPDATE player SET connected = ?, playerid = ? WHERE id = ?", [player.connected, player.playerid, player.id]);
  for (const type of ["level", "money", "hours", "kills"]) {
    const t = await run("top", interaction("1", { type }));
    assert.ok(t.lb.length > 0, type);
  }
});

test("sanciones: permisos, ban, tempban, unban, mute", async () => {
  assert.match((await run("ban", interaction(PLAYER_DISCORD, { name: admin.name, reason: "x" }))).error, /Necesitas el rango/);
  assert.match((await run("ban", interaction("777", { name: admin.name, reason: "x" }))).error, /vincula/);

  const r = await run("ban", interaction(ADMIN_DISCORD, { name: player.name, reason: "cheats" }));
  assert.ok(r.ok, JSON.stringify(r));
  const [ban] = await db.query("SELECT b.*, UNIX_TIMESTAMP(b.expire_date) AS ts, h.type, h.text, h.by FROM bans b JOIN bad_history h ON h.id = b.id_history WHERE b.name = ?", [player.name]);
  assert.deepStrictEqual([Number(ban.ts), ban.type, ban.text, ban.by], [0, 2, "cheats", admin.id]);
  // Así lo lee el gamemode al conectarse (OnPlayerBannedCheck)
  const [check] = await db.query("SELECT *, UNIX_TIMESTAMP(bans.expire_date) AS expire_date_ts FROM bans LEFT JOIN bad_history ON bans.id_history = bad_history.id WHERE bans.name = ?", [player.name]);
  assert.strictEqual(Number(check.expire_date_ts), 0);
  assert.match((await run("ban", interaction(ADMIN_DISCORD, { name: player.name, reason: "x" }))).error, /ya está baneado/);
  const [act] = await db.query("SELECT * FROM discord_actions WHERE player_id = ? ORDER BY id DESC LIMIT 1", [player.id]);
  assert.strictEqual(act.action, "kick");

  assert.ok((await run("unban", interaction(ADMIN_DISCORD, { name: player.name }))).ok);
  assert.match((await run("unban", interaction(ADMIN_DISCORD, { name: player.name }))).error, /no está en la lista/);

  assert.ok((await run("tempban", interaction(ADMIN_DISCORD, { name: player.name, days: 3, reason: "spam" }))).ok);
  const [tb] = await db.query("SELECT TIMESTAMPDIFF(HOUR, NOW(), expire_date) AS h FROM bans WHERE name = ?", [player.name]);
  assert.ok(Number(tb.h) >= 71 && Number(tb.h) <= 72);
  assert.ok((await run("profile", interaction(ADMIN_DISCORD, { name: player.name }))).embed.fields.some((f) => f.name.includes("Baneado")));
  await run("unban", interaction(ADMIN_DISCORD, { name: player.name }));

  assert.ok((await run("mute", interaction(ADMIN_DISCORD, { name: player.name, minutes: 10, reason: "flood" }))).ok);
  const [m] = await db.query("SELECT mute - UNIX_TIMESTAMP() AS left_s FROM player WHERE id = ?", [player.id]);
  assert.ok(Number(m.left_s) > 590 && Number(m.left_s) <= 600);
  assert.match((await run("mute", interaction(ADMIN_DISCORD, { name: player.name, minutes: 1, reason: "x" }))).error, /ya está silenciado/);
  assert.ok((await run("unmute", interaction(ADMIN_DISCORD, { name: player.name }))).ok);
  const [m2] = await db.query("SELECT mute FROM player WHERE id = ?", [player.id]);
  assert.strictEqual(Number(m2.mute), 0);

  // un jugador con más rango no se puede sancionar
  await db.query("UPDATE player SET admin_level = 5 WHERE id = ?", [player.id]);
  await db.query("UPDATE player SET admin_level = 4 WHERE id = ?", [admin.id]);
  assert.match((await run("mute", interaction(ADMIN_DISCORD, { name: player.name, minutes: 1, reason: "x" }))).error, /superior/);
  await db.query("UPDATE player SET admin_level = ? WHERE id = ?", [player.admin_level, player.id]);
  await db.query("UPDATE player SET admin_level = ? WHERE id = ?", [admin.admin_level, admin.id]);
});

test("desvincular", async () => {
  assert.ok((await run("unlink", interaction(PLAYER_DISCORD))).ok);
  assert.ok((await run("unlink", interaction(PLAYER_DISCORD))).error);
});
