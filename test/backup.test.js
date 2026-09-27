/*
 * Copias de seguridad del servidor de Discord contra la base de datos local y un Discord falso en memoria:
 * copia completa, copia incremental de mensajes, "destrozo" del servidor y restauración.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const db = require("../src/database/mysql");
const store = require("../src/database/serverBackup");
const engine = require("../src/assets/utils/serverBackup");

let seq = (BigInt(Date.now()) << 22n) + BigInt(Math.floor(Math.random() * 1e6)) * 64n;
const sid = () => String(++seq);
const G = sid();
const G2 = sid();
const OWNER = sid();

// ---------------------------------------------------------------- Discord falso
function fakeDiscord() {
  const guilds = new Map();
  const channels = new Map(); // id -> canal (con guild_id)
  const messages = new Map(); // canal -> mensajes
  const hooks = new Map();
  const calls = [];

  function addGuild(id, name) {
    const g = { guild: { id, name, owner_id: OWNER, icon: null, banner: null, splash: null, discovery_splash: null, verification_level: 1 }, roles: [{ id, name: "@everyone", permissions: "1024", position: 0, color: 0, hoist: false, mentionable: false, managed: false }], emojis: [], members: [], bans: [] };
    guilds.set(id, g);
    return g;
  }
  function addChannel(guildId, c) {
    const ch = { id: sid(), guild_id: guildId, permission_overwrites: [], parent_id: null, topic: null, nsfw: false, position: 0, ...c };
    channels.set(ch.id, ch);
    messages.set(ch.id, []);
    return ch;
  }
  function addMessage(channelId, content, extra = {}) {
    const m = { id: sid(), type: 0, content, author: { id: "700000000000000001", username: "juan", global_name: "Juan", avatar: null }, timestamp: new Date().toISOString(), attachments: [], embeds: [], ...extra };
    messages.get(channelId).push(m);
    return m;
  }
  const guildChannels = (id) => [...channels.values()].filter((c) => c.guild_id === id && ![10, 11, 12].includes(c.type));

  async function handle(method, route, opts = {}) {
    calls.push(`${method} ${route}`);
    const q = opts.query || new URLSearchParams();
    const body = opts.body;
    let m;
    const notFound = () => {
      throw Object.assign(new Error("Unknown"), { status: 404 });
    };
    if ((m = route.match(/^\/guilds\/(\d+)(\/.*)?$/))) {
      const g = guilds.get(m[1]) || notFound();
      const rest = m[2] || "";
      if (rest === "" && method === "GET") return { ...g.guild, roles: g.roles };
      if (rest === "" && method === "PATCH") return Object.assign(g.guild, body);
      if (rest === "/roles" && method === "GET") return g.roles.map((r) => ({ ...r }));
      if (rest === "/roles" && method === "POST") {
        const r = { id: sid(), position: 1, color: 0, hoist: false, mentionable: false, managed: false, ...body };
        g.roles.push(r);
        return r;
      }
      if (rest === "/roles" && method === "PATCH") {
        for (const p of body) Object.assign(g.roles.find((r) => r.id === p.id) || {}, { position: p.position });
        return g.roles;
      }
      if ((m = rest.match(/^\/roles\/(\d+)$/))) {
        const r = g.roles.find((x) => x.id === m[1]) || notFound();
        if (method === "PATCH") return Object.assign(r, body);
        if (method === "DELETE") return void g.roles.splice(g.roles.indexOf(r), 1);
      }
      if (rest === "/channels" && method === "GET") return guildChannels(g.guild.id).map((c) => ({ ...c }));
      if (rest === "/channels" && method === "POST") return addChannel(g.guild.id, body);
      if (rest === "/channels" && method === "PATCH") {
        for (const p of body) Object.assign(channels.get(p.id) || {}, { position: p.position });
        return;
      }
      if (rest === "/emojis" && method === "GET") return g.emojis;
      if (rest === "/stickers" && method === "GET") return [];
      if (rest === "/threads/active") return { threads: [...channels.values()].filter((c) => c.guild_id === g.guild.id && [10, 11, 12].includes(c.type)) };
      if (rest === "/members" && method === "GET") {
        const after = BigInt(q.get("after") || "0");
        return g.members.filter((x) => BigInt(x.user.id) > after).slice(0, Number(q.get("limit")));
      }
      if ((m = rest.match(/^\/members\/(\d+)\/roles\/(\d+)$/)) && method === "PUT") {
        g.members.find((x) => x.user.id === m[1]).roles.push(m[2]);
        return;
      }
      if (rest === "/bans") return [];
      return notFound(); // automod, onboarding, pantalla de bienvenida: el servidor no los tiene
    }
    if ((m = route.match(/^\/channels\/(\d+)(\/.*)?$/))) {
      const c = channels.get(m[1]) || notFound();
      const rest = m[2] || "";
      if (rest === "" && method === "PATCH") return Object.assign(c, body);
      if (rest === "" && method === "DELETE") return void channels.delete(c.id);
      if (rest === "/threads/archived/public") return { threads: [] };
      if (rest === "/messages" && method === "GET") {
        const after = BigInt(q.get("after") || "0");
        // Como Discord: con "after" vienen los siguientes, del más nuevo al más viejo
        return messages.get(c.id).filter((x) => BigInt(x.id) > after).slice(0, Number(q.get("limit"))).reverse();
      }
      if (rest === "/webhooks" && method === "POST") {
        const h = { id: sid(), token: "tok", channel_id: c.id };
        hooks.set(h.id, h);
        return h;
      }
      if (rest === "/threads" && method === "POST") return addChannel(c.guild_id, { ...body, parent_id: c.id });
    }
    if ((m = route.match(/^\/webhooks\/(\d+)(?:\/(\w+))?$/))) {
      const h = hooks.get(m[1]) || notFound();
      if (method === "DELETE") return void hooks.delete(h.id);
      const target = q.get("thread_id") || h.channel_id;
      const posted = { id: sid(), type: 0, content: body.content || "", author: { id: h.id, username: body.username, avatar: null }, webhook: true, files: (opts.files || []).map((f) => f.name), embeds: body.embeds || [], attachments: [], timestamp: new Date().toISOString() };
      messages.get(target).push(posted);
      return posted;
    }
    throw new Error(`Ruta no simulada: ${method} ${route}`);
  }
  const rest = {
    get: (r, o) => handle("GET", r, o),
    post: (r, o) => handle("POST", r, o),
    patch: (r, o) => handle("PATCH", r, o),
    put: (r, o) => handle("PUT", r, o),
    delete: (r, o) => handle("DELETE", r, o),
  };
  return { rest, guilds, channels, messages, calls, addGuild, addChannel, addMessage, guildChannels };
}

// ---------------------------------------------------------------- preparación
let d;
let files;
let fileUrl;
let general;
let admin;
const png = Buffer.from("imagen-de-prueba-del-backup");

test.before(async () => {
  await store.init();
  files = http.createServer((req, res) => res.end(png));
  await new Promise((r) => files.listen(0, "127.0.0.1", r));
  fileUrl = `http://127.0.0.1:${files.address().port}/captura.png`;

  d = fakeDiscord();
  const g = d.addGuild(G, "SampCity Prueba");
  admin = { id: sid(), name: "Admin", permissions: "8", position: 2, color: 0xe8392f, hoist: true, mentionable: false, managed: false };
  g.roles.push(admin);
  g.members.push({ user: { id: "700000000000000001", username: "juan" }, roles: [admin.id], joined_at: new Date().toISOString() });
  const cat = d.addChannel(G, { type: 4, name: "INFORMACIÓN", position: 0 });
  general = d.addChannel(G, { type: 0, name: "💬┆general", topic: "Charla", position: 1, parent_id: cat.id, permission_overwrites: [{ id: G, type: 0, allow: "0", deny: "2048" }, { id: admin.id, type: 0, allow: "2048", deny: "0" }] });
  d.addChannel(G, { type: 2, name: "🔊┆voz", position: 2, parent_id: cat.id });
  d.addMessage(general.id, "Hola a todos");
  d.addMessage(general.id, "Mira esta captura", { attachments: [{ id: sid(), filename: "captura.png", size: png.length, content_type: "image/png", url: fileUrl }] });
  d.addMessage(general.id, "Bienvenidos a **SampCity**");
});

test.after(async () => {
  files.close();
  for (const id of [G, G2]) {
    await db.query("DELETE f FROM bot_backup_files f JOIN bot_backup_messages m ON m.message_id = f.message_id WHERE m.guild_id = ?", [id]);
    await db.query("DELETE FROM bot_backup_messages WHERE guild_id = ?", [id]);
    await db.query("DELETE FROM bot_backups WHERE guild_id = ?", [id]);
  }
  await db.close();
});

// ---------------------------------------------------------------- pruebas
test("ayudantes: permisos con roles nuevos, orden de canales y nombres de webhook", () => {
  const map = new Map([["1", "10"]]);
  assert.deepStrictEqual(
    engine.remapOverwrites([{ id: "99", type: 0, allow: "0", deny: "1" }, { id: "1", type: 0, allow: "8", deny: "0" }, { id: "2", type: 0, allow: "8", deny: "0" }, { id: "5", type: 1, allow: "1", deny: "0" }], map, "77", "99"),
    [{ id: "77", type: 0, allow: "0", deny: "1" }, { id: "10", type: 0, allow: "8", deny: "0" }, { id: "5", type: 1, allow: "1", deny: "0" }],
  );
  const sorted = engine.sortChannels([{ id: "a", type: 0, position: 0 }, { id: "b", type: 4, position: 1 }, { id: "c", type: 4, position: 0 }, { id: "d", type: 2, position: 1 }]);
  assert.deepStrictEqual(sorted.map((c) => c.id), ["c", "b", "a", "d"]);
  assert.strictEqual(engine.webhookName({ username: "discordfan" }), "d1sc0rdfan");
  assert.strictEqual(engine.webhookName({ global_name: "Juan", username: "juan" }), "Juan");
});

test("copia completa: estructura, mensajes y archivos", async () => {
  const r = await engine.createBackup(d.rest, G, { kind: "manual", by: OWNER });
  assert.strictEqual(r.stats.channels, 3);
  assert.strictEqual(r.stats.roles, 2);
  assert.strictEqual(r.stats.members, 1);
  assert.strictEqual(r.messages.messages, 3);
  assert.strictEqual(r.messages.files, 1);
  assert.ok(r.size < 5000, "la estructura comprimida pesa poco");
  const saved = await store.channelMessages(general.id);
  assert.deepStrictEqual(saved.map((m) => m.content), ["Hola a todos", "Mira esta captura", "Bienvenidos a **SampCity**"]);
  const f = await store.getFile(saved[1].attachments[0].id);
  assert.deepStrictEqual(Buffer.from(f.data), png);
  const [last] = await store.listBackups(G, 1);
  assert.strictEqual(last.id, r.id);
  assert.ok(Math.abs(last.created_at.getTime() - Date.now()) < 120000, "la fecha se guarda en UTC");
});

test("la siguiente copia solo agrega los mensajes nuevos", async () => {
  d.addMessage(general.id, "Mensaje nuevo 1");
  d.addMessage(general.id, "Mensaje nuevo 2");
  const r = await engine.createBackup(d.rest, G, { kind: "auto" });
  assert.strictEqual(r.messages.messages, 2);
  assert.strictEqual(r.messages.files, 0);
  const t = await store.totals(G);
  assert.strictEqual(t.messages, 5);
  assert.strictEqual(t.files, 1);
  assert.strictEqual(t.backups, 2);
  assert.ok(await store.lastBackupDate(G, "auto"));
});

test("no se hacen dos copias a la vez del mismo servidor", async () => {
  const a = engine.createBackup(d.rest, G, { kind: "manual" });
  await assert.rejects(engine.createBackup(d.rest, G, { kind: "manual" }), /Ya se está haciendo/);
  await a;
});

test("restaurar después de un destrozo: vuelven el rol, el canal con sus permisos y los mensajes", async () => {
  const backup = await store.getBackup(G);
  // Destrozo: borran el canal general y el rol Admin, cambian el nombre del servidor y crean un canal de spam
  d.channels.delete(general.id);
  const g = d.guilds.get(G);
  g.roles.splice(g.roles.findIndex((r) => r.id === admin.id), 1);
  g.members[0].roles = [];
  g.guild.name = "HACKEADO";
  d.addChannel(G, { type: 0, name: "spam", position: 9 });

  const { report } = await engine.restoreBackup(d.rest, G, backup.snapshot, { deleteExtra: true });
  assert.deepStrictEqual(report.errors, []);
  assert.strictEqual(report.rolesCreated, 1);
  assert.strictEqual(report.channelsCreated, 1);
  assert.strictEqual(report.deleted, 1);
  assert.strictEqual(report.messages, 5);
  assert.strictEqual(g.guild.name, "SampCity Prueba");

  const newAdmin = g.roles.find((r) => r.name === "Admin");
  assert.ok(newAdmin && newAdmin.id !== admin.id);
  assert.strictEqual(newAdmin.permissions, "8");
  assert.ok(g.members[0].roles.includes(newAdmin.id), "el miembro recupera su rol");

  const chans = d.guildChannels(G);
  assert.ok(!chans.some((c) => c.name === "spam"));
  const restored = chans.find((c) => c.name === "💬┆general");
  const cat = chans.find((c) => c.type === 4);
  assert.strictEqual(restored.parent_id, cat.id);
  assert.strictEqual(restored.topic, "Charla");
  assert.deepStrictEqual(restored.permission_overwrites, [{ id: G, type: 0, allow: "0", deny: "2048" }, { id: newAdmin.id, type: 0, allow: "2048", deny: "0" }]);

  const posted = d.messages.get(restored.id);
  assert.deepStrictEqual(posted.map((m) => m.content), ["Hola a todos", "Mira esta captura", "Bienvenidos a **SampCity**", "Mensaje nuevo 1", "Mensaje nuevo 2"]);
  assert.ok(posted.every((m) => m.webhook && m.author.username === "Juan"));
  assert.deepStrictEqual(posted[1].files, ["captura.png"]);
  assert.ok(!d.calls.some((c) => c.startsWith("POST /channels/") && c.endsWith("/webhooks") && d.channels.get(c.split("/")[2])?.name === "🔊┆voz"));
});

test("el archivo descargado sirve para montar el servidor en otro servidor nuevo", async () => {
  const backup = await store.getBackup(G);
  const { buffer, withMessages } = await engine.exportBackup(backup);
  assert.ok(withMessages);
  assert.throws(() => engine.importBackup(Buffer.from("no es una copia")), /no es una copia válida/);

  const { snapshot, source } = engine.importBackup(buffer);
  d.addGuild(G2, "Servidor nuevo");
  const { report } = await engine.restoreBackup(d.rest, G2, snapshot, { source });
  assert.deepStrictEqual(report.errors, []);
  assert.strictEqual(report.channelsCreated, 3);
  const chans = d.guildChannels(G2);
  assert.deepStrictEqual(chans.map((c) => c.name).sort(), ["INFORMACIÓN", "💬┆general", "🔊┆voz"].sort());
  const general2 = chans.find((c) => c.name === "💬┆general");
  // Del archivo salen los mensajes (el de la foto dice que el archivo no venía en la copia descargada)
  const posted = d.messages.get(general2.id).map((m) => m.content);
  assert.strictEqual(posted.length, 5);
  assert.match(posted[1], /Mira esta captura\n\*\[1 archivo/);
  assert.strictEqual(d.guilds.get(G2).guild.name, "SampCity Prueba");
});
