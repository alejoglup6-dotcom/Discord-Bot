/*
 * TikTok: /tiktok add | remove | list y el aviso de videos de creadores que mencionan a la cuenta oficial
 * (src/handlers/functions/tiktok.js), con TikTok y Discord falsos y la base de datos local.
 */
require("dotenv").config({ quiet: true });
process.env.TIKTOK_USER = "sampcity.oficial";
process.env.TIKTOK_CREATORS = "";
const test = require("node:test");
const assert = require("node:assert");
const Discord = require("discord.js");
const odm = require("../src/database/odm");
const tiktokVideos = require("../src/database/models/tiktokVideos");
const tiktokCreators = require("../src/database/models/tiktokCreators");
const handler = require("../src/handlers/functions/tiktok");
const add = require("../src/commands/tiktok/add");
const remove = require("../src/commands/tiktok/remove");

const GUILD = "test-guild-tiktok";
const STAFF = "900000000000000101";
const CREATOR_DISCORD = "900000000000000102";

// ---------------------------------------------------------------- TikTok falso
const profiles = {
  "sampcity.oficial": { nickname: "SampCity | FaseBeta", videos: [] },
  "creador.uno": {
    nickname: "Creador Uno",
    videos: [
      { id: "7000000000000000001", desc: "mi casa nueva @SampCity | FaseBeta #samp", tags: ["sampcity.oficial"] },
      { id: "7000000000000000002", desc: "con @SampCity fan club", tags: ["otra.cuenta"] }, // otra cuenta con nombre parecido
      { id: "7000000000000000003", desc: "otro juego, sin etiquetas", tags: [] },
      { id: "7000000000000000004", desc: "persecucion @sampcity.oficial", tags: null }, // la pagina del video falla
    ],
  },
  "privada.uno": { nickname: "Privada", private: true },
  "sin.videos": { nickname: "Nuevo", videos: [] },
};
const pageCalls = [];
function html(id, state) {
  return `<html><script id="${id}" type="application/json">${JSON.stringify(state)}</script></html>`;
}
const realFetch = global.fetch;
global.fetch = async (url) => {
  url = String(url);
  const res = (status, body) => ({ ok: status === 200, status, text: async () => body, json: async () => JSON.parse(body), headers: new Map() });
  let m = url.match(/tiktok\.com\/embed\/@([^/?]+)/);
  if (m) {
    const p = profiles[decodeURIComponent(m[1])];
    if (!p) return res(400, html("__FRONTITY_CONNECT_STATE__", { source: { data: { x: { userInfo: { code: 10221 } } } } }));
    const userInfo = { uniqueId: m[1], nickname: p.nickname, privateAccount: !!p.private };
    const data = p.private ? { userInfo } : { userInfo, videoList: p.videos.map((v) => ({ id: v.id, desc: v.desc, coverUrl: "https://img.test/c.jpg" })) };
    return res(200, html("__FRONTITY_CONNECT_STATE__", { source: { data: { x: data } } }));
  }
  m = url.match(/tiktok\.com\/@([^/]+)\/video\/(\d+)/);
  if (m && !url.includes("oembed")) {
    pageCalls.push(m[2]);
    const v = (profiles[m[1]]?.videos || []).find((x) => x.id === m[2]);
    if (!v || !v.tags) return res(500, "");
    const item = { id: v.id, desc: v.desc, textExtra: v.tags.map((t) => ({ type: 0, userUniqueId: t })), contents: [] };
    return res(200, html("__UNIVERSAL_DATA_FOR_REHYDRATION__", { __DEFAULT_SCOPE__: { "webapp.video-detail": { itemInfo: { itemStruct: item } } } }));
  }
  return res(404, ""); // miniaturas y oembed: sin imagen
};

// ---------------------------------------------------------------- Discord falso
const sent = [];
const channel = { id: "c1", name: "🎵┆tiktok", type: Discord.ChannelType.GuildText, rawPosition: 0, send: async (m) => (sent.push(m), m) };
const guild = { id: GUILD, name: "prueba", channels: { cache: new Discord.Collection([["c1", channel]]) }, roles: { cache: new Map() } };
const client = { guilds: { cache: new Map([[GUILD, guild]]) }, once: () => {}, on: () => {} };
handler(client);
const replies = [];
client.errNormal = async ({ error }) => replies.push({ ok: false, text: error });
client.succNormal = async ({ text, fields }) => replies.push({ ok: true, text, fields });

async function run(cmd, options) {
  const interaction = {
    guild,
    user: { id: STAFF },
    options: {
      getString: (n) => options[n] ?? null,
      getUser: (n) => (options[n] ? { id: options[n], toString: () => `<@${options[n]}>` } : null),
    },
  };
  await cmd(client, interaction);
  return replies[replies.length - 1];
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
  assert.strictEqual(handler.normalizeCreator("@Creador.Uno"), "creador.uno");
  assert.strictEqual(handler.normalizeCreator("https://www.tiktok.com/@creador.uno?lang=es"), "creador.uno");
  assert.strictEqual(handler.normalizeCreator("no vale con espacios"), null);
});

test("mencion por el texto: usuario y nombre para mostrar leido del perfil", () => {
  handler.setOfficialNick({ nickname: "SampCity | FaseBeta" });
  assert.ok(handler.textMentions("hola @sampcity.oficial"));
  assert.ok(handler.textMentions("casa nueva @SampCity | FaseBeta #samp"));
  assert.ok(!handler.textMentions("@sampcity.oficial2"));
  assert.ok(!handler.textMentions("#sampcity"));
});

test("/tiktok add: guarda al creador y publica solo los videos que de verdad mencionan a la cuenta", async () => {
  const r = await run(add, { user: "@creador.uno", miembro: CREATOR_DISCORD });
  assert.ok(r.ok, r.text);
  // 1: etiqueta real (pagina del video). 2: "@SampCity fan club" etiqueta a otra cuenta. 3: sin @. 4: la pagina falla -> por el texto
  assert.deepStrictEqual(sent.map((m) => m.content.match(/video\/(\d+)/)[1].slice(-1)), ["1", "4"]);
  assert.ok(sent[0].content.includes(`<@${CREATOR_DISCORD}>`));
  assert.deepStrictEqual(sent[0].allowedMentions.parse, []);
  assert.ok(!pageCalls.includes("7000000000000000003"), "sin @ no hace falta abrir el video");
  assert.match(r.fields[0].value, /4 videos recientes: 2 mencionan/);
  const doc = await tiktokCreators.findOne({ Guild: GUILD, User: "creador.uno" });
  assert.strictEqual(doc.Member, CREATOR_DISCORD);
  assert.strictEqual(doc.AddedBy, STAFF);
});

test("la revision periodica solo publica menciones nuevas y no vuelve a abrir videos ya leidos", async () => {
  sent.length = 0;
  pageCalls.length = 0;
  assert.strictEqual((await client.checkTikTokMentions()).posted, 0);
  assert.deepStrictEqual(pageCalls, ["7000000000000000004"]); // solo el que fallo se reintenta
  profiles["creador.uno"].videos.push({ id: "7000000000000000009", desc: "evento @SampCity | FaseBeta", tags: ["sampcity.oficial"] });
  assert.strictEqual((await client.checkTikTokMentions()).posted, 1);
  assert.ok(sent[0].content.includes("7000000000000000009"));
  assert.strictEqual((await client.checkTikTokMentions()).posted, 0);
});

test("/tiktok add: cuenta que no existe, privada, sin videos, repetida o la oficial", async () => {
  assert.match((await run(add, { user: "no.existe.123" })).text, /no existe/);
  assert.match((await run(add, { user: "privada.uno" })).text, /privada/);
  assert.match((await run(add, { user: "sampcity.oficial" })).text, /cuenta del servidor/);
  assert.match((await run(add, { user: "creador.uno" })).text, /ya está en la lista/);
  const r = await run(add, { user: "sin.videos" });
  assert.ok(r.ok, r.text);
  assert.match(r.fields[0].value, /no tiene videos públicos/);
});

test("/tiktok remove", async () => {
  assert.ok((await run(remove, { user: "creador.uno" })).ok);
  assert.strictEqual(await tiktokCreators.findOne({ Guild: GUILD, User: "creador.uno" }), null);
  assert.strictEqual((await run(remove, { user: "creador.uno" })).ok, false);
});
