/*
 * Verificación con la cuenta del juego, tickets nuevos y reorganización del servidor, con un servidor de Discord
 * simulado (test/helpers/fakeGuild.js) y la copia de la base de datos. Deja la base como estaba.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { fakeGuild } = require("./helpers/fakeGuild");
const v = require("../src/assets/utils/verification");
const data = require("../src/assets/data/rangos");
const { useMariaDbShim } = require("./helpers/mariadb");

test.before(async () => {
  await useMariaDbShim().catch(() => {});
});

test("verificación: vinculado = rol y apodo; sin vincular = sin rol (salvo admins)", () => {
  const g = fakeGuild();
  const role = g.mkRole(data.LINKED_ROLE);
  const linked = g.mkMember("10", { username: "pepe" });
  const old = g.mkMember("11", { roleNames: [data.LINKED_ROLE] });
  const admin = g.mkMember("12", { roleNames: [data.LINKED_ROLE], admin: true });
  const owner = g.mkMember("1", {});
  const link = { name: "Juan_Perez", playerId: 5 };
  assert.deepStrictEqual(v.planMember(linked, link, role, g.guild, "on"), { addRole: true, removeRole: false, nick: "Juan_Perez" });
  assert.deepStrictEqual(v.planMember(old, undefined, role, g.guild, "on"), { addRole: false, removeRole: true, nick: null });
  assert.strictEqual(v.planMember(old, undefined, role, g.guild, "suave").removeRole, false);
  assert.strictEqual(v.planMember(admin, undefined, role, g.guild, "on").removeRole, false);
  assert.strictEqual(v.planMember(owner, link, role, g.guild, "on").nick, null); // al dueño no se le puede cambiar
  linked.nickname = "Juan_Perez";
  linked.roles.cache.set(role.id, role);
  assert.deepStrictEqual(v.planMember(linked, link, role, g.guild, "on"), { addRole: false, removeRole: false, nick: null });
});

test("verificación: applyMember pone rol y apodo", async () => {
  const g = fakeGuild();
  const role = g.mkRole(data.LINKED_ROLE);
  const m = g.mkMember("20");
  await v.applyMember(m, { name: "Ana_Lopez" }, role, () => {}, { welcome: false, mode: "on" });
  assert.ok(m.roles.cache.has(role.id));
  assert.strictEqual(m.nickname, "Ana_Lopez");
  await v.applyMember(m, undefined, role, () => {}, { mode: "on" });
  assert.ok(!m.roles.cache.has(role.id));
});

// ---------------------------------------------------------------- tickets

function fakeInteraction(g, member, extra = {}) {
  const replies = [];
  return {
    guild: g.guild,
    member,
    user: member.user,
    client: { user: { id: "bot" } },
    replies,
    deferReply: async () => {},
    editReply: async (p) => replies.push(p),
    reply: async (p) => replies.push(p),
    showModal: async (m) => replies.push({ modal: m }),
    isStringSelectMenu: () => false,
    isModalSubmit: () => true,
    ...extra,
  };
}

test("tickets: formulario, canal, atender, cerrar, cierre automático y estadísticas", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const db = require("../src/database/mysql");
  const Tickets = require("../src/database/models/tickets");
  const TicketChannels = require("../src/database/models/ticketChannels");
  const Info = require("../src/database/models/ticketInfo");
  const tp = require("../src/assets/utils/ticketsPro");

  const g = fakeGuild({ id: "900000000000000666" });
  const support = g.mkRole("🎫 SOPORTE");
  const mod = g.mkRole(data.BY_KEY.get("staff_moderador").role);
  const cat = g.mkChannel({ name: "tickets", type: ChannelType.GuildCategory });
  const logs = g.mkChannel({ name: "log-tickets" });
  await Tickets.findOneAndUpdate({ Guild: g.guild.id }, { $set: { Category: cat.id, Role: support.id, Logs: logs.id, Channel: "x", TicketCount: 0 } }, { upsert: true });
  const user = g.mkMember("30", { username: "nuevo" });
  const staff = g.mkMember("31", { username: "staff", roleNames: ["🎫 SOPORTE"] });
  const client = { user: { id: "bot" }, users: { fetch: async () => user.user }, guilds: { cache: new Map([[g.guild.id, g.guild]]) }, transcript: async () => {} };
  try {
    // formulario de "Reportar a un jugador": el canal lo ven el autor, soporte y los Moderadores para arriba
    const form = fakeInteraction(g, user, {
      customId: "Bot_tp_form:reporte",
      fields: { getTextInputValue: (id) => ({ acusado: "Malo_Malote", hechos: "Me mató sin rol en Idlewood", pruebas: "" })[id] },
    });
    await tp.onForm(client, form);
    const ch = g.channels.find((c) => c.parentId === cat.id);
    assert.ok(ch, "se creó el canal");
    assert.strictEqual(ch.name, "「🚨」reporte-0001");
    assert.ok(ch.permissionOverwrites.cache.get(mod.id), "los moderadores lo ven");
    assert.ok(ch.permissionOverwrites.cache.get(g.guild.id).deny.has(PermissionFlagsBits.ViewChannel));
    const info = await Info.findOne({ Guild: g.guild.id, channelID: ch.id });
    assert.strictEqual(info.type, "reporte");
    assert.ok(JSON.parse(info.answers).some((a) => a.value.includes("Idlewood")));
    // segundo ticket: no se puede
    const again = fakeInteraction(g, user, { customId: "Bot_tp_form:ayuda", fields: { getTextInputValue: () => "x" } });
    await tp.onForm(client, again);
    assert.match(again.replies[0].content, /Ya tienes un ticket/);

    // atender: solo staff
    const claimUser = fakeInteraction(g, user, { customId: "Bot_tp_claim", channel: ch, message: null });
    await tp.handle(client, { ...claimUser, isButton: () => true, isModalSubmit: () => false });
    assert.match(claimUser.replies[0].content, /Solo el staff/);
    const claimStaff = fakeInteraction(g, staff, { customId: "Bot_tp_claim", channel: ch, message: null, isModalSubmit: () => false });
    await tp.handle(client, claimStaff);
    assert.strictEqual((await TicketChannels.findOne({ Guild: g.guild.id, channelID: ch.id })).claimed, staff.id);

    // cerrar con motivo
    assert.ok(await tp.closeTicket(client, g.guild, ch, staff.user, "Sancionado"));
    const closed = await Info.findOne({ Guild: g.guild.id, channelID: ch.id });
    assert.strictEqual(closed.reason, "Sancionado");
    assert.strictEqual(ch.name, "「🔒」cerrado-0001");
    assert.ok(g.sent.some((s) => s.channel === logs));
    // se borra solo pasadas las horas
    await tp.sweep(client, Date.now() + 25 * 3600000);
    assert.ok(!g.channels.get(ch.id), "el canal cerrado se borró");

    // ticket sin actividad: aviso y luego cierre automático
    await tp.onForm(client, fakeInteraction(g, user, { customId: "Bot_tp_form:ayuda", fields: { getTextInputValue: () => "Ayuda con el banco" } }));
    const ch2 = g.channels.find((c) => c.parentId === cat.id);
    ch2.lastMessageId = null;
    const info2 = await Info.findOne({ Guild: g.guild.id, channelID: ch2.id });
    await tp.sweep(client, new Date(info2.openedAt).getTime() + 49 * 3600000);
    assert.strictEqual((await Info.findOne({ Guild: g.guild.id, channelID: ch2.id })).reminded, true);
    ch2.lastMessageId = null;
    await tp.sweep(client, new Date(info2.openedAt).getTime() + 73 * 3600000);
    assert.strictEqual((await TicketChannels.findOne({ Guild: g.guild.id, channelID: ch2.id })).resolved, true);

    const s = await tp.stats(g.guild.id);
    assert.strictEqual(s.total, 2);
    assert.strictEqual(s.byType.reporte, 1);
    assert.strictEqual(s.byStaff[staff.id], 1);
  } finally {
    await Info.deleteMany({ Guild: g.guild.id });
    await TicketChannels.deleteMany({ Guild: g.guild.id });
    await Tickets.deleteMany({ Guild: g.guild.id });
    void db;
  }
});

// ---------------------------------------------------------------- reorganización

test("reorganizar: vista sin cambios, luego categorías, nombres, permisos y mensajes", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const Tickets = require("../src/database/models/tickets");
  const LayoutPosts = require("../src/database/models/layoutPosts");
  const layout = require("../src/assets/utils/serverLayout");
  const g = fakeGuild({ id: "900000000000000777" });
  const verified = g.mkRole(data.LINKED_ROLE);
  // servidor "viejo" con el estilo de la plantilla
  const info = g.mkChannel({ name: "ℹ️ INFORMACIÓN", type: ChannelType.GuildCategory });
  const gen = g.mkChannel({ name: "💬 GENERAL", type: ChannelType.GuildCategory });
  const staffCat = g.mkChannel({ name: "🛡️ STAFF", type: ChannelType.GuildCategory });
  await staffCat.permissionOverwrites.edit(g.guild.id, { ViewChannel: false });
  const stats = g.mkChannel({ name: "📊 Estadisticas", type: ChannelType.GuildCategory });
  const ticketsCat = g.mkChannel({ name: "🎫 TICKETS", type: ChannelType.GuildCategory });
  const old = {
    bienvenidas: g.mkChannel({ name: "🎍┆bienvenidas", parent: info }),
    verificacion: g.mkChannel({ name: "✅┆verificacion", parent: info }),
    reglas: g.mkChannel({ name: "📜┆reglas", parent: info }),
    soporte: g.mkChannel({ name: "🔎┆soporte", parent: info }),
    guia: g.mkChannel({ name: "🚀┆guia-nuevos", parent: info }),
    faq: g.mkChannel({ name: "❓┆faq", parent: info }),
    general: g.mkChannel({ name: "💬┆general", parent: gen }),
    memes: g.mkChannel({ name: "😂┆memes", parent: gen }),
    staff: g.mkChannel({ name: "💻┆staff", parent: staffCat }),
    rstaff: g.mkChannel({ name: "📜┆reglamento-staff", parent: staffCat }),
    miembros: g.mkChannel({ name: "Miembros: 9", type: ChannelType.GuildVoice, parent: stats }),
  };
  await old.reglas.send({ content: "regla vieja de la plantilla" });
  await Tickets.findOneAndUpdate({ Guild: g.guild.id }, { $set: { Category: ticketsCat.id, Channel: old.soporte.id } }, { upsert: true });
  const client = { user: { id: "bot" } };
  try {
    const before = g.channels.map((c) => `${c.id}:${c.name}:${c.parentId}`).join("|");
    const preview = await layout.organize(client, g.guild, { dry: true });
    assert.ok(preview.length > 5);
    assert.strictEqual(g.channels.map((c) => `${c.id}:${c.name}:${c.parentId}`).join("|"), before, "la vista no cambia nada");

    await layout.organize(client, g.guild, { dry: false, cleanMessages: true });
    // nombres nuevos, mismo canal (conserva ID)
    assert.strictEqual(old.reglas.name, "「📖」normas");
    assert.strictEqual(old.verificacion.name, "「🔐」verificacion");
    assert.strictEqual(old.guia.name, "「🧭」primeros-pasos");
    assert.strictEqual(old.faq.name, "「❓」preguntas");
    assert.strictEqual(info.name, "✦ EMPIEZA AQUÍ");
    assert.strictEqual(ticketsCat.name, "✦ TICKETS ABIERTOS");
    // faq pasó a la guía (categoría nueva) y general a LA CALLE (la categoría vieja renombrada)
    const guia = g.channels.find((c) => c.name === "✦ GUÍA DE LA CIUDAD");
    assert.strictEqual(old.faq.parentId, guia.id);
    assert.strictEqual(gen.name, "✦ LA CALLE");
    // orden: EMPIEZA AQUÍ y justo debajo los tickets
    const cats = g.channels.filter((c) => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position).map((c) => c.name);
    assert.deepStrictEqual(cats.slice(0, 2), ["✦ EMPIEZA AQUÍ", "✦ TICKETS ABIERTOS"]);
    // permisos: inicio para todos, el resto solo verificados; staff y estadísticas sin tocar
    assert.ok(old.reglas.permissionsFor(g.everyone).has(PermissionFlagsBits.ViewChannel));
    assert.ok(old.reglas.permissionOverwrites.cache.get(g.guild.id).deny.has(PermissionFlagsBits.SendMessages), "normas solo lectura");
    assert.ok(!old.general.permissionsFor(g.everyone).has(PermissionFlagsBits.ViewChannel));
    assert.ok(old.general.permissionOverwrites.cache.get(verified.id).allow.has(PermissionFlagsBits.ViewChannel));
    assert.ok(!old.staff.permissionOverwrites.cache.get(verified.id), "el canal de staff no se abre a los verificados");
    assert.ok(!old.miembros.permissionOverwrites.cache.get(verified.id), "los contadores siguen a la vista");
    assert.strictEqual(old.rstaff.name, "📜┆reglamento-staff", "el reglamento del staff no se confunde con las normas");
    // mensajes: la regla vieja se borró y están los nuevos
    assert.ok(![...old.reglas.messages.cache.values()].some((m) => m.payload.content === "regla vieja de la plantilla"));
    assert.ok(old.reglas.messages.cache.size >= 2);
    assert.ok(old.soporte.messages.cache.size === 1 && old.verificacion.messages.cache.size === 1);
    assert.ok(await LayoutPosts.findOne({ Guild: g.guild.id, Slot: "normas" }));
    // la categoría vieja que quedó vacía se borra; las de staff y estadísticas no
    assert.ok(g.channels.get(staffCat.id) && g.channels.get(stats.id));
    // segunda vez: nada que cambiar salvo volver a publicar los mensajes
    const again = await layout.organize(client, g.guild, { dry: true, cleanMessages: false });
    assert.ok(again.every((l) => /publicar|versión anterior/.test(l)), again.join("\n"));
  } finally {
    await LayoutPosts.deleteMany({ Guild: g.guild.id });
    await Tickets.deleteMany({ Guild: g.guild.id });
  }
});

test.after(() => require("../src/database/mysql").close());
