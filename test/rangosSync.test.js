/*
 * Limpieza del servidor y roles de banda (src/handlers/functions/rangosSync.js) con un servidor de Discord simulado.
 * Usa la copia de la base de datos del servidor (tabla crews) y deja todo como estaba.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const { Collection, PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const sync = require("../src/handlers/functions/rangosSync");
const data = require("../src/assets/data/rangos");

function fakeGuild(names) {
  let next = 1;
  const roles = new Collection();
  const members = new Collection();
  const guild = { id: "900000000000000999", members: { cache: members, fetch: async () => members } };
  const mkRole = (name, extra = {}) => {
    const id = String(next++);
    const role = {
      id,
      name,
      hexColor: "#000000",
      position: extra.position ?? roles.size + 1,
      editable: true,
      permissions: new PermissionsBitField(extra.admin ? PermissionFlagsBits.Administrator : 0n),
      get members() {
        return members.filter((m) => m.roles.cache.has(id));
      },
      async delete() {
        roles.delete(id);
        for (const m of members.values()) m.roles.cache.delete(id); // como en Discord
      },
      async setName(n) {
        role.name = n;
        return role;
      },
      async edit(o) {
        if (o.name) role.name = o.name;
        if (o.color) role.hexColor = o.color;
        return role;
      },
      async setPermissions(p) {
        role.permissions = new PermissionsBitField(p);
        return role;
      },
      async setPosition(pos) {
        // como en Discord: los que quedan en medio se corren un puesto
        for (const r of roles.values()) {
          if (r.id === id) continue;
          if (pos < role.position && r.position >= pos && r.position < role.position) r.position++;
          else if (pos > role.position && r.position <= pos && r.position > role.position) r.position--;
        }
        role.position = pos;
        return role;
      },
    };
    roles.set(id, role);
    return role;
  };
  guild.roles = { cache: roles, create: async ({ name, color }) => Object.assign(mkRole(name), { hexColor: color || "#000000" }) };
  for (const n of names) mkRole(typeof n === "string" ? n : n.name, typeof n === "string" ? {} : n);
  const addMember = (id, roleNames) => {
    const set = new Collection();
    for (const n of roleNames) {
      const r = roles.find((x) => x.name === n);
      set.set(r.id, r);
    }
    const m = { id, user: { bot: false, tag: id }, roles: { cache: set, add: async (r) => [].concat(r).forEach((x) => set.set(x.id, x)), remove: async (r) => [].concat(r).forEach((x) => set.delete(x.id)) } };
    members.set(id, m);
    return m;
  };
  return { guild, roles, addMember };
}

test("limpieza: duplicados, 💎 VIP, permiso de 🥊 BETA y SHERIFF encima de ALGUACIL", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const db = require("../src/database/mysql");
  const before = await db.query("SELECT * FROM discord_crew_roles WHERE guild_id = '900000000000000999'").catch(() => []);
  const { guild, roles, addMember } = fakeGuild([
    "📱 ANDROID",
    "📱 Android",
    "🔔 Anuncios",
    "📢 Avisos: Anuncios",
    "💎 VIP",
    { name: "🥊 BETA", admin: true },
    { name: "🎖 SHERIFF", position: 50 },
    { name: "🎖 ALGUACIL", position: 60 },
  ]);
  const m = addMember("1", ["📱 Android", "📢 Avisos: Anuncios"]);
  try {
    // en prueba (dry) no cambia nada
    const dry = await sync.syncGuild(guild, true);
    assert.ok(dry.some((l) => l.includes("📱 Android -> 📱 ANDROID")));
    assert.ok(roles.some((r) => r.name === "💎 VIP"));

    await sync.syncGuild(guild, false);
    const names = new Set(roles.map((r) => r.name));
    for (const n of ["📱 Android", "📢 Avisos: Anuncios", "💎 VIP"]) assert.ok(!names.has(n), n);
    assert.deepStrictEqual(new Set(m.roles.cache.map((r) => r.name)), new Set(["📱 ANDROID", "🔔 Anuncios"]));
    assert.ok(!roles.find((r) => r.name === "🥊 BETA").permissions.has(PermissionFlagsBits.Administrator));
    assert.ok(roles.find((r) => r.name === "🎖 SHERIFF").position > roles.find((r) => r.name === "🎖 ALGUACIL").position);

    // roles de banda: uno por banda de la tabla crews
    const crews = await db.query("SELECT id, name FROM crews");
    for (const c of crews) assert.ok(names.has(`${data.CREW_ROLE_PREFIX}${c.name.trim()}`), c.name);
    // la segunda vuelta ya no tiene nada que hacer con la limpieza ni con las bandas
    const again = await sync.syncGuild(guild, false);
    assert.ok(!again.some((l) => l.startsWith("limpieza") || l.includes("rol de banda")), again.join("\n"));
  } finally {
    await db.query("DELETE FROM discord_crew_roles WHERE guild_id = '900000000000000999'");
    for (const r of before) await db.query("INSERT INTO discord_crew_roles VALUES (?, ?, ?)", [r.guild_id, r.crew_id, r.role_id]);
  }
});

test.after(() => require("../src/database/mysql").close());
