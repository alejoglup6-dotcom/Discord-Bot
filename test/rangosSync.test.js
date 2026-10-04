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
  guild.roles = {
    cache: roles,
    create: async ({ name, color }) => Object.assign(mkRole(name, { position: 1 }), { hexColor: color || "#000000" }),
    async setPositions(list) {
      for (const { role, position } of list) role.position = position;
    },
  };
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

test("orden por jerarquía: los roles creados al fondo suben a su sitio y los demás no se mueven", () => {
  // como estaba el Discord el 04-oct-2026 (de arriba abajo)
  const current = [
    "🔱 FUNDADOR", "⚜️ CO-FUNDADOR", "🥊 BETA", "⭕ ENCARGADO STAFF", "🛡️ ADMINISTRADOR", "🎫 SOPORTE", "🤖 BOTS",
    "🎖 SHERIFF", "🎖 ALGUACIL", "👮 COMISARIO", "👮 POLICIA", "👤 USUARIO", "🔔 Anuncios",
    "🛠️ DESARROLLADOR", "👮 Subjefe", "👮 Cadete (Policía)", "🎖 Sub Sheriff",
  ];
  // los cuatro últimos se crearon nuevos: en Discord quedan empatados en la posición 1
  const out = sync.orderNames(current, sync.desiredOrder(), new Set(current.slice(-4)));
  const at = (n) => out.indexOf(n);
  assert.strictEqual(out.length, current.length);
  // DESARROLLADOR entre CO-FUNDADOR y ENCARGADO
  assert.ok(at("⚜️ CO-FUNDADOR") < at("🛠️ DESARROLLADOR") && at("🛠️ DESARROLLADOR") < at("⭕ ENCARGADO STAFF"));
  // policía: COMISARIO, sus rangos y el rol POLICIA; luego el Sheriff con los suyos y ALGUACIL
  const police = ["👮 COMISARIO", "👮 Subjefe", "👮 Cadete (Policía)", "👮 POLICIA", "🎖 SHERIFF", "🎖 Sub Sheriff", "🎖 ALGUACIL"];
  assert.deepStrictEqual(out.filter((n) => police.includes(n)), police);
  // los que no son rangos siguen en su orden y con sus vecinos
  assert.deepStrictEqual(out.filter((n) => ["🥊 BETA", "🤖 BOTS", "👤 USUARIO", "🔔 Anuncios"].includes(n)), ["🥊 BETA", "🤖 BOTS", "👤 USUARIO", "🔔 Anuncios"]);
  assert.ok(at("🔔 Anuncios") > at("🎖 ALGUACIL"));
  // ya ordenado: no cambia nada
  assert.deepStrictEqual(sync.orderNames(out), out);
  // el orden deseado sigue la lista RANKS
  const d = sync.desiredOrder();
  assert.ok(d.indexOf("🔱 FUNDADOR") < d.indexOf("🛠️ DESARROLLADOR") && d.indexOf("🛠️ DESARROLLADOR") < d.indexOf("🎫 SOPORTE"));
});

test("al momento: los triggers apuntan los cambios y se sincroniza solo esa cuenta", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const db = require("../src/database/mysql");
  const rangos = require("../src/database/rangos");
  await rangos.init();
  // sin permiso para triggers (MySQL con registro binario y sin SUPER) la cola solo la llena el gamemode
  const r = await rangos.initQueue();
  const triggers = r.ok;
  if (triggers) assert.ok(r.triggers >= 5);
  const gameQueues = (id) => !triggers && db.query("INSERT INTO discord_sync_queue (player_id) VALUES (?) ON DUPLICATE KEY UPDATE changed_at = CURRENT_TIMESTAMP(3)", [id]);
  const [p] = await db.query("SELECT id, admin_level, cash FROM player ORDER BY id LIMIT 1");
  const DISCORD = "900000000000000777";
  await db.query("DELETE FROM discord_links WHERE player_id = ? OR discord_id = ?", [p.id, DISCORD]);
  try {
    await rangos.takeQueue(); // vacía lo que hubiera
    // un cambio que no importa (dinero en mano) no se apunta
    await db.query("UPDATE player SET cash = cash + 1 WHERE id = ?", [p.id]);
    assert.deepStrictEqual(await rangos.takeQueue(), []);
    // vincular y subir a Desarrollador: se apunta una vez
    await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [p.id, DISCORD]);
    await db.query("UPDATE player SET admin_level = 7 WHERE id = ?", [p.id]);
    await gameQueues(p.id);
    assert.deepStrictEqual(await rangos.takeQueue(), [p.id]);
    assert.deepStrictEqual(await rangos.takeQueue(), []);

    const { guild, addMember } = fakeGuild(["🛡️ ADMINISTRADOR", "🛠️ DESARROLLADOR", "👤 USUARIO"]);
    const m = addMember(DISCORD, ["🛡️ ADMINISTRADOR"]);
    await sync.syncPlayers(guild, [p.id], false);
    const names = new Set(m.roles.cache.map((x) => x.name));
    assert.ok(names.has("🛠️ DESARROLLADOR") && !names.has("🛡️ ADMINISTRADOR"), [...names].join(", "));
  } finally {
    await db.query("DELETE FROM discord_links WHERE discord_id = ?", [DISCORD]);
    await db.query("UPDATE player SET admin_level = ?, cash = ? WHERE id = ?", [p.admin_level, p.cash, p.id]);
    await db.query("DELETE FROM discord_sync_queue WHERE player_id = ?", [p.id]);
    await db.query("DELETE FROM discord_crew_roles WHERE guild_id = '900000000000000999'");
  }
});

test.after(() => require("../src/database/mysql").close());
