/*
 * Sincronizacion juego -> Discord (src/handlers/functions/sampSync.js) con un servidor de Discord falso, contra una
 * copia de la base de datos del servidor (s107_Samp.sql cargado).
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const db = require("../src/database/mysql");
const samp = require("../src/database/samp");
const SampSync = require("../src/database/models/sampSync");

const DISCORD = "900000000000000077";
const GUILD = "test-guild-sync";
let player, admin, before;

function fakeGuild() {
  const log = [];
  const roles = new Map();
  const member = {
    id: DISCORD,
    communicationDisabledUntilTimestamp: null,
    roles: {
      cache: { has: (id) => member._roles.has(id) },
      add: async (r) => (member._roles.add(r.id), log.push("vip+")),
      remove: async (r) => (member._roles.delete(r.id), log.push("vip-")),
    },
    _roles: new Set(),
    timeout: async (ms) => {
      member.communicationDisabledUntilTimestamp = ms ? Date.now() + ms : null;
      log.push(ms ? "timeout" : "untimeout");
    },
  };
  const guild = {
    id: GUILD,
    name: "prueba",
    roles: {
      cache: { find: (fn) => [...roles.values()].find(fn) },
      create: async (o) => {
        const r = { id: "r" + roles.size, name: o.name };
        roles.set(r.id, r);
        return r;
      },
    },
    members: {
      fetch: async (id) => (id === DISCORD ? member : Promise.reject(new Error("no"))),
      ban: async () => log.push("ban"),
      unban: async () => log.push("unban"),
    },
  };
  return { guild, member, log };
}

const handlers = {};
const fake = fakeGuild();
const client = {
  user: { id: "bot" },
  guilds: { cache: new Map([[GUILD, fake.guild]]) },
  once: () => {},
  on: (ev, fn) => (handlers[ev] = fn),
};
require("../src/handlers/functions/sampSync")(client);

test.before(async () => {
  assert.ok(await samp.init());
  [player] = await db.query("SELECT id, name, vip, vip_expire_date, mute FROM player WHERE admin_level = 0 ORDER BY id DESC LIMIT 1");
  [admin] = await db.query("SELECT id, name FROM player WHERE admin_level >= 4 ORDER BY id LIMIT 1");
  const [[b], [h], [a]] = await Promise.all([
    db.query("SELECT COALESCE(MAX(id), 0) AS id FROM bans"),
    db.query("SELECT COALESCE(MAX(id), 0) AS id FROM bad_history"),
    db.query("SELECT COALESCE(MAX(id), 0) AS id FROM discord_actions"),
  ]);
  before = { ban: b.id, history: h.id, action: a.id };
  await db.query("DELETE FROM discord_links WHERE discord_id = ? OR player_id = ?", [DISCORD, player.id]);
  await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [player.id, DISCORD]);
  await SampSync.deleteMany({ Guild: GUILD });
});

test.after(async () => {
  await db.query("DELETE FROM discord_links WHERE discord_id = ?", [DISCORD]);
  await db.query("DELETE FROM bans WHERE id > ?", [before.ban]);
  await db.query("DELETE FROM bad_history WHERE id > ?", [before.history]);
  await db.query("DELETE FROM discord_actions WHERE id > ?", [before.action]);
  await db.query("UPDATE player SET vip = ?, vip_expire_date = ?, mute = ? WHERE id = ?", [player.vip, player.vip_expire_date, player.mute, player.id]);
  await SampSync.deleteMany({ Guild: GUILD });
  await db.close();
});

test("VIP del juego -> rol en Discord, y se quita al caducar", async () => {
  await db.query("UPDATE player SET vip = 2, vip_expire_date = DATE_ADD(NOW(), INTERVAL 3 DAY), mute = 0 WHERE id = ?", [player.id]);
  await client.sampSyncNow();
  assert.ok(fake.log.includes("vip+"));
  await db.query("UPDATE player SET vip = 0 WHERE id = ?", [player.id]);
  await client.sampSyncNow();
  assert.ok(fake.log.includes("vip-"));
});

test("silencio del juego -> aislamiento en Discord, y se quita al acabar", async () => {
  fake.log.length = 0;
  await db.query("UPDATE player SET mute = UNIX_TIMESTAMP() + 600 WHERE id = ?", [player.id]);
  await client.sampSyncNow();
  assert.deepStrictEqual(fake.log, ["timeout"]);
  await client.sampSyncNow(); // ya aislado: no repite
  assert.deepStrictEqual(fake.log, ["timeout"]);
  await db.query("UPDATE player SET mute = 0 WHERE id = ?", [player.id]);
  await client.sampSyncNow();
  assert.deepStrictEqual(fake.log, ["timeout", "untimeout"]);
});

test("baneo del juego -> baneo en Discord; al desbanear se quita", async () => {
  fake.log.length = 0;
  const full = await samp.getPlayerById(player.id);
  await samp.ban(full, admin, "prueba", 0);
  await client.sampSyncNow();
  assert.deepStrictEqual(fake.log, ["ban"]);
  await client.sampSyncNow();
  assert.deepStrictEqual(fake.log, ["ban"]);
  await samp.unban(full, admin);
  await client.sampSyncNow();
  assert.deepStrictEqual(fake.log, ["ban", "unban"]);
});
