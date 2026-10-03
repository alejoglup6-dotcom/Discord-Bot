/*
 * TikTok de creadores de contenido: /tiktok y el aviso de sus videos que mencionan a la cuenta oficial
 * (src/handlers/functions/tiktok.js), con TikTok y Discord falsos y la base de datos local.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const Discord = require("discord.js");
const odm = require("../src/database/odm");
const tiktokVideos = require("../src/database/models/tiktokVideos");
const tiktokCreators = require("../src/database/models/tiktokCreators");
const { cleanUser, mentionsOfficial, parseProfile } = require("../src/assets/utils/tiktok");
const handler = require("../src/handlers/functions/tiktok");
const command = require("../src/interactions/Command/tiktok");

const GUILD = "test-guild-tiktok";
const ALICE = "900000000000000101";
const BOB = "900000000000000102";

// ---------------------------------------------------------------- TikTok falso
const profiles = {
  "creador.uno": [
    { id: "7000000000000000001", desc: "mi casa nueva @sampcity.oficial #samp" },
    { id: "7000000000000000002", desc: "otro juego, nada que ver" },
    { id: "7000000000000000003", desc: "trabajo de minero @SampCity.Oficial" },
    { id: "7000000000000000004", desc: "persecucion @sampcity.oficial" },
    { id: "7000000000000000005", desc: "dron en la ciudad @sampcity.oficial" },
  ],
};
function page(user) {
  const list = profiles[user];
  const state = list
    ? { source: { data: { [`/embed/@${user}`]: { userInfo: { uniqueId: user }, videoList: list } } } }
    : { source: { data: { [`/embed/@${user}`]: { userInfo: { uniqueId: user } } } } };
  return `<html><script id="__FRONTITY_CONNECT_STATE__" type="application/json">${JSON.stringify(state)}</script></html>`;
}
const realFetch = global.fetch;
global.fetch = async (url) => {
  const user = decodeURIComponent(String(url).match(/@([^/?]+)/)[1]);
  return { ok: !!profiles[user], status: profiles[user] ? 200 : 400, text: async () => page(user) };
};

// ---------------------------------------------------------------- Discord falso
const sent = [];
const channel = {
  id: "c1",
  name: "🎵┆tiktok",
  type: Discord.ChannelType.GuildText,
  rawPosition: 0,
  send: async (m) => (sent.push(m), m),
  toString: () => "<#c1>",
};
const guild = { id: GUILD, channels: { cache: new Discord.Collection([["c1", channel]]) } };

const client = { guilds: { cache: new Map([[GUILD, guild]]) }, once: () => {}, on: () => {} };
handler(client);
const replies = [];
client.errNormal = async ({ error }) => replies.push({ ok: false, text: error });
client.succNormal = async ({ text }) => replies.push({ ok: true, text });

function run(userId, options, staff = false) {
  const interaction = {
    guild,
    user: { id: userId },
    member: { permissions: { has: () => staff } },
    deferReply: async () => {},
    options: {
      getString: (n) => options[n] ?? null,
      getBoolean: (n) => options[n] ?? null,
      getUser: (n) => (options[n] ? { id: options[n] } : null),
    },
  };
  return command.run(client, interaction).then(() => replies[replies.length - 1]);
}

async function clean() {
  await tiktokCreators.deleteMany({ Guild: GUILD });
  await tiktokVideos.deleteMany({ Guild: GUILD });
}
test.before(clean);
test.after(async () => {
  await clean();
  global.fetch = realFetch;
  await odm.close();
});

// ---------------------------------------------------------------- pruebas
test("usuario de TikTok: @, enlaces y nombres no validos", () => {
  assert.strictEqual(cleanUser("@Creador.Uno"), "creador.uno");
  assert.strictEqual(cleanUser("https://www.tiktok.com/@creador.uno?lang=es"), "creador.uno");
  assert.strictEqual(cleanUser("tiktok.com/@creador_2/video/123"), "creador_2");
  assert.strictEqual(cleanUser("no vale con espacios"), null);
  assert.strictEqual(cleanUser(""), null);
});

test("mencion a la cuenta oficial", () => {
  assert.ok(mentionsOfficial("hola @sampcity.oficial"));
  assert.ok(mentionsOfficial("@SAMPCITY.OFICIAL!"));
  assert.ok(!mentionsOfficial("@sampcity.oficial2"));
  assert.ok(!mentionsOfficial("#sampcity #samp"));
});

test("pagina de incrustar perfil: videos ordenados y cuenta sin videos", () => {
  const p = parseProfile(page("creador.uno"));
  assert.ok(p.exists);
  assert.deepStrictEqual(p.videos.map((v) => v.id.slice(-1)), ["1", "2", "3", "4", "5"]);
  assert.strictEqual(parseProfile(page("nadie")).exists, false);
});

test("/tiktok registra al creador y publica sus 3 ultimas menciones", async () => {
  const r = await run(ALICE, { user: "@creador.uno" });
  assert.ok(r.ok, r.text);
  assert.strictEqual(sent.length, 3);
  assert.deepStrictEqual(sent.map((m) => m.content.match(/video\/(\d+)/)[1].slice(-1)), ["3", "4", "5"]);
  assert.ok(sent[0].content.includes(`<@${ALICE}>`));
  const doc = await tiktokCreators.findOne({ Guild: GUILD, User: ALICE });
  assert.strictEqual(doc.TikTok, "creador.uno");
});

test("la revision periodica solo publica menciones nuevas", async () => {
  sent.length = 0;
  assert.strictEqual(await client.checkTikTokCreators(), 0);
  profiles["creador.uno"].push({ id: "7000000000000000009", desc: "nuevo evento @sampcity.oficial" });
  profiles["creador.uno"].push({ id: "7000000000000000010", desc: "sin mencion" });
  assert.strictEqual(await client.checkTikTokCreators(), 1);
  assert.ok(sent[0].content.includes("7000000000000000009"));
  assert.strictEqual(await client.checkTikTokCreators(), 0);
});

test("otro miembro no puede registrar ni quitar un TikTok ajeno; el staff si", async () => {
  assert.strictEqual((await run(BOB, { user: "creador.uno" })).ok, false);
  assert.strictEqual((await run(BOB, { user: "creador.uno", quitar: true })).ok, false);
  assert.strictEqual((await run(BOB, { user: "creador.uno", miembro: ALICE })).ok, false);
  assert.strictEqual((await run(BOB, { user: "creador.uno", quitar: true }, true)).ok, true);
  assert.strictEqual(await tiktokCreators.findOne({ Guild: GUILD, TikTok: "creador.uno" }), null);
});

test("cuenta que no existe o la oficial", async () => {
  assert.strictEqual((await run(ALICE, { user: "no.existe.123" })).ok, false);
  assert.strictEqual((await run(ALICE, { user: "sampcity.oficial" })).ok, false);
  assert.strictEqual(await tiktokCreators.findOne({ Guild: GUILD, User: ALICE }), null);
});
