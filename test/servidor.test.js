/*
 * Bienvenida/despedida, invitaciones y sus premios, contadores, premios semanales de la Fortuna y tablas en
 * vivo, con un servidor de Discord simulado (sin conectarse a Discord) y MySQL de pruebas.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("events");
const { Collection, ChannelType } = require("discord.js");
const odm = require("../src/database/odm");
const db = require("../src/database/mysql");
const samp = require("../src/database/samp");
const Economy = require("../src/database/models/economy");
const Invites = require("../src/database/models/invites");
const InviteBy = require("../src/database/models/inviteBy");
const Log = require("../src/database/models/inviteRewardLog");
const Layout = require("../src/database/models/serverLayout");
const config = require("../src/assets/data/invites");
const catalog = require("../src/assets/data/fortuna");

const G = "test-srv-" + Date.now();
const DAY = 86400000;

// ---- servidor simulado ----
const sent = [];
function channel(id, name, type = ChannelType.GuildText, parentId = null) {
  return {
    id,
    name,
    type,
    parentId,
    rawPosition: Number(id.slice(-3)),
    toString: () => `<#${id}>`,
    send: async (p) => {
      const m = { channelId: id, payload: p, author: { id: "bot" }, embeds: (p.embeds || []).map((e) => e.data || e), edit: async (x) => ((m.payload = x), m) };
      sent.push(m);
      return m;
    },
    messages: { fetch: async () => new Collection() },
    setName: async function (n) {
      this.name = n;
    },
  };
}
const roleAdds = [];
function role(id, name) {
  return { id, name, members: new Collection(), toString: () => `<@&${id}>` };
}
const guild = {
  id: G,
  name: "SampCity",
  memberCount: 42,
  premiumSubscriptionCount: 2,
  premiumTier: 1,
  iconURL: () => null,
  bannerURL: () => null,
  channels: { cache: new Collection() },
  roles: { cache: new Collection() },
  emojis: { cache: new Collection() },
  members: {
    cache: new Collection(),
    fetch: async (id) => ({ id, user: { id, bot: false }, roles: { add: async (r) => roleAdds.push([id, r.id]), remove: async () => {} } }),
  },
};
const add = (c) => guild.channels.cache.set(c.id, c);
add(channel("c001", "📖┆reglas"));
add(channel("c002", "🎍┆bienvenidas"));
add(channel("c003", "👋┆despedidas"));
add(channel("c004", "🎁┆recompensas-invitaciones"));
add(channel("c005", "🔔┆invitados"));
add(channel("c006", "💰┆info-fortuna"));
add(channel("c007", "🕴┆fortuna"));
add(channel("c008", "💼┆millonarios"));
add(channel("c010", "📊 ESTADÍSTICAS", ChannelType.GuildCategory));
add(channel("c011", "👤 Miembros: 9", ChannelType.GuildVoice, "c010"));
add(channel("c012", "🚀 Boosts: 0", ChannelType.GuildVoice, "c010"));
add(channel("c013", "💬 Canales: 5", ChannelType.GuildVoice, "c010"));
add(channel("c014", "🎭 Roles: 1", ChannelType.GuildVoice, "c010"));
for (const [i, t] of config.TIERS.entries()) guild.roles.cache.set("r" + i, role("r" + i, t.role));
guild.roles.cache.set("rm", role("rm", catalog.MAGNATE_ROLE));

function member(id, { days = 100, name = "Nuevo_Jugador" } = {}) {
  return {
    id,
    guild,
    displayName: name,
    joinedTimestamp: Date.now() - 3 * DAY,
    toString: () => `<@${id}>`,
    user: {
      id,
      bot: false,
      username: name,
      tag: name,
      createdTimestamp: Date.now() - days * DAY,
      displayAvatarURL: () => "https://assets.open.mp/assets/images/skins/170.png",
    },
  };
}

const client = new EventEmitter();
client.config = require("../src/config/bot.js");
client.emotes = require("../src/config/emojis.json");
client.user = { id: "bot", username: "SampCity", avatarURL: () => null };
client.users = { fetch: async (id) => ({ id, username: "u" + id, tag: "u" + id, toString: () => `<@${id}>` }) };
client.guilds = { cache: new Collection([[G, guild]]) };
require("../src/handlers/components/embed")(client);
require("../src/handlers/functions/statsRefresh")(client);

test.after(async () => {
  for (const m of [Economy, Invites, InviteBy, Log, Layout]) await m.deleteMany({ Guild: G });
  await odm.close();
});

const inviteJoin = require("../src/events/invite/inviteJoin");
const memberRemove = require("../src/events/guild/guildMemberRemove");

test("bienvenida: encuentra el canal por nombre, tarjeta y datos del que invitó", async () => {
  sent.length = 0;
  await inviteJoin(client, member("u1"), { code: "abc" }, { id: "inv1", username: "Reclutador", tag: "Reclutador" });
  const msg = sent.find((m) => m.channelId === "c002");
  assert.ok(msg, "tiene que publicar en 🎍┆bienvenidas");
  const embed = msg.payload.embeds[0].data;
  assert.match(embed.title, /Bienvenido\/a a SampCity/);
  assert.strictEqual(embed.image.url, "attachment://bienvenida.png");
  assert.strictEqual(msg.payload.files[0].name, "bienvenida.png");
  assert.strictEqual(msg.payload.content, "<@u1>");
  const f = Object.fromEntries(embed.fields.map((x) => [x.name, x.value]));
  assert.match(f["📨┆Invitado por"], /<@inv1>/);
  assert.match(f["🚀┆Primeros pasos"], /<#c001>/); // reglas
  assert.match(f["🚀┆Primeros pasos"], /<#c004>/); // recompensas
});

test("invitaciones: conteo por miembro, premio una sola vez y cuentas nuevas no cuentan", async () => {
  const money = async (id) => (await Economy.findOne({ Guild: G, User: id }).lean())?.Money || 0;
  assert.strictEqual(await money("inv1"), config.PER_INVITE);

  await inviteJoin(client, member("u2"), { code: "abc" }, { id: "inv1", username: "R", tag: "R" });
  await inviteJoin(client, member("u3"), { code: "abc" }, { id: "inv1", username: "R", tag: "R" });
  // Tercera invitación: nivel "Reclutador" (rol + premio)
  assert.strictEqual(await money("inv1"), config.PER_INVITE * 3 + config.TIERS[0].money);
  assert.deepStrictEqual(roleAdds, [["inv1", "r0"]]);
  const last = sent.filter((m) => m.channelId === "c002").pop().payload.embeds[0].data;
  assert.ok(last.fields.some((x) => /Reclutador/.test(x.value)));

  // Cuenta de 2 días: cuenta como invitación, pero sin premio
  await inviteJoin(client, member("u4", { days: 2 }), { code: "abc" }, { id: "inv1", username: "R", tag: "R" });
  assert.strictEqual(await money("inv1"), config.PER_INVITE * 3 + config.TIERS[0].money);

  // Sale u2: se descuenta al que lo invitó (antes se perdía quién invitó a quién)
  sent.length = 0;
  await memberRemove(client, member("u2"));
  const inv = await Invites.findOne({ Guild: G, User: "inv1" }).lean();
  assert.deepStrictEqual([inv.Invites, inv.Total, inv.Left], [3, 4, 1]);
  const bye = sent.find((m) => m.channelId === "c003");
  assert.ok(bye, "tiene que publicar en 👋┆despedidas");
  assert.strictEqual(bye.payload.embeds[0].data.image.url, "attachment://despedida.png");

  // Vuelve a entrar: no paga de nuevo por la misma persona
  const before = await money("inv1");
  await inviteJoin(client, member("u2"), { code: "abc" }, { id: "inv1", username: "R", tag: "R" });
  assert.strictEqual(await money("inv1"), before);
});

test("multicuentas: cuentas nuevas no suben de nivel ni dan dinero", async () => {
  const before = roleAdds.length;
  for (const id of ["f1", "f2", "f3", "f4"]) {
    await inviteJoin(client, member(id, { days: 1 }), { code: "x" }, { id: "inv2", username: "T", tag: "T" });
  }
  assert.strictEqual((await Economy.findOne({ Guild: G, User: "inv2" }).lean())?.Money || 0, 0);
  assert.strictEqual(roleAdds.length, before);
  const inv = await Invites.findOne({ Guild: G, User: "inv2" }).lean();
  assert.strictEqual(inv.Invites, 4); // aparecen en la tabla como "sin premio"
  const last = sent.filter((m) => m.channelId === "c002").pop().payload.embeds[0].data;
  assert.ok(last.fields.some((f) => /Cuenta nueva/.test(f.name) && /multicuentas/.test(f.value)));
  assert.match(last.fields.find((f) => /Invitado por/.test(f.name)).value, /0 invitaciones válidas/);
});

test("contadores: se encuentran por nombre y conservan su emoji", async () => {
  const r = await client.refreshStats(guild);
  const names = Object.fromEntries(r.map((x) => [x.field, x.to]));
  assert.strictEqual(names.Members, "👤 Miembros: 42");
  assert.strictEqual(names.Boost, "🚀 Boosts: 2");
  assert.strictEqual(names.Channels, `💬 Canales: ${guild.channels.cache.size}`);
  assert.strictEqual(guild.channels.cache.get("c011").name, "👤 Miembros: 42");
  // Recién renombrados: no se vuelven a tocar enseguida (límite de Discord)
  guild.memberCount = 43;
  const again = await client.refreshStats(guild);
  assert.strictEqual(again.find((x) => x.field === "Members").reason, "wait");
});

test("premios semanales: la primera vez solo anota la fecha; después paga al top 3 y da el rol", async () => {
  const prizes = require("../src/handlers/functions/fortunaPrizes");
  await Economy.create({ Guild: G, User: "rich1", Money: 900000, Bank: 0 });
  await Economy.create({ Guild: G, User: "rich2", Money: 500000, Bank: 100000 });
  await Economy.create({ Guild: G, User: "rich3", Money: 300000, Bank: 0 });

  const key = prizes.lastPrizeKey();
  await Layout.deleteMany({ Guild: G });
  // Simula el ciclo: sin registro -> solo anota
  await Layout.findOneAndUpdate({ Guild: G }, { $set: { LastPrizeWeek: key } }, { upsert: true });
  assert.strictEqual(await prizes.awardWeek(client, guild, key), null);

  sent.length = 0;
  const winners = await prizes.awardWeek(client, guild, "semana-siguiente");
  assert.deepStrictEqual(winners.map((w) => w.user), ["rich1", "rich2", "rich3"]);
  assert.strictEqual((await Economy.findOne({ Guild: G, User: "rich1" })).Money, 900000 + catalog.WEEKLY_PRIZES[0]);
  assert.ok(roleAdds.some(([u, r]) => u === "rich1" && r === "rm"));
  assert.ok(sent.find((m) => m.channelId === "c007"), "anuncia en 🕴┆fortuna");
  // No paga dos veces la misma semana
  assert.strictEqual(await prizes.awardWeek(client, guild, "semana-siguiente"), null);
});

test("tablas: ranking de invitaciones y millonarios del juego", async () => {
  const boards = require("../src/handlers/functions/liveBoards");
  const inv = (await boards.invitesBoard(client, guild)).toJSON();
  assert.match(inv.description, /🥇 <@inv1> · \*\*3\*\* válidas \*\(\+1 sin premio\)\*/);
  assert.match(inv.description, /Medida|multicuentas/);
  assert.match(inv.description, /<#c004>/);

  await samp.init();
  const rich = (await boards.richestBoard(client, guild)).toJSON();
  const [top] = await db.query("SELECT name, cash + bank_money AS total FROM player ORDER BY total DESC, id LIMIT 1");
  assert.ok(rich.description.startsWith(`🥇 ⚫ **${top.name.replace(/_/g, "\\_")}**`), rich.description.split("\n")[0]);
});
