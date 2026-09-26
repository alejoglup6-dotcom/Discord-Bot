/*
 * Pruebas de los comandos con prefijo "!" (src/assets/utils/prefixCommands.js): mensajes simulados que pasan
 * por el puente y ejecutan los comandos reales (fortuna, economía y /samp) contra MySQL. No hace falta Discord.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("events");
const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");
const odm = require("../src/database/odm");
const db = require("../src/database/mysql");
const samp = require("../src/database/samp");
const Economy = require("../src/database/models/economy");
const Fortuna = require("../src/database/models/fortuna");
const Assets = require("../src/database/models/fortunaAssets");
const Functions = require("../src/database/models/functions");
const { runPrefixCommand, tokenize } = require("../src/assets/utils/prefixCommands");

const G = "test-prefix-" + Date.now();
const U = "900000000000000020";

// Cliente con los mismos helpers de mensajes que el bot
const client = new EventEmitter();
client.config = require("../src/config/bot.js");
client.emotes = require("../src/config/emojis.json");
client.user = { id: "1", username: "Drok", avatarURL: () => null };
client.users = { fetch: async (id) => ({ id, username: "u" + id, bot: false, displayAvatarURL: () => null }) };
client.commands = new Collection();
for (const f of fs.readdirSync(path.join(__dirname, "../src/interactions/Command"))) {
  const c = require(`../src/interactions/Command/${f}`);
  client.commands.set(c.data.name, c);
}
require("../src/handlers/components/embed")(client);
require("../src/handlers/functions/functions")(client);
require("../src/handlers/functions/samp")(client);
const errors = [];
client.on("errorCreate", (err) => errors.push(err));

// Mensaje simulado: guarda lo que el bot responde (en el canal, respondiendo o por MD)
let sent = [];
function sentMessage(where, payload) {
  const m = { where, payload, edits: [], edit: async (p) => (m.edits.push(p), m), delete: async () => {} };
  sent.push(m);
  return m;
}
function message(content, author = U) {
  return {
    client,
    id: String(Date.now()),
    content,
    guild: {
      id: G,
      name: "Prueba",
      members: { fetch: async (id) => ({ id, user: { id } }) },
      channels: { cache: new Collection() },
      roles: { cache: new Collection() },
    },
    guildId: G,
    channel: { id: "c1", send: async (p) => sentMessage("channel", p), sendTyping: async () => {} },
    channelId: "c1",
    member: { id: author, permissions: { has: () => true } },
    author: { id: author, username: "tester", bot: false, send: async (p) => sentMessage("dm", p), displayAvatarURL: () => null },
    attachments: new Collection(),
    createdTimestamp: Date.now(),
    reply: async (p) => sentMessage("reply", p),
  };
}

// Ejecuta "!..." y espera la respuesta (algunos comandos responden sin await)
async function run(content, author) {
  sent = [];
  const handled = await runPrefixCommand(client, message(content.slice(1), author), content.slice(1), "!");
  for (let i = 0; i < 100 && !sent.length; i++) await new Promise((r) => setTimeout(r, 10));
  await new Promise((r) => setTimeout(r, 30));
  const last = sent[sent.length - 1];
  const payload = last ? (last.edits.length ? last.edits[last.edits.length - 1] : last.payload) : null;
  const embed = payload?.embeds?.[0]?.data || {};
  return { handled, where: last?.where, embed, text: JSON.stringify(embed) };
}

test.before(async () => {
  await samp.init();
  await Functions.create({ Guild: G, Prefix: "!" });
});

test.after(async () => {
  for (const m of [Economy, Fortuna, Assets, Functions]) await m.deleteMany({ Guild: G });
  await db.query("DELETE FROM discord_links WHERE discord_id = ?", [U]);
  await odm.close();
});

test("separar palabras y comillas", () => {
  assert.deepStrictEqual(
    tokenize('comprar casas "casa en ganton"').map((t) => t.value),
    ["comprar", "casas", "casa en ganton"],
  );
});

test("mensajes que no son comandos no se tocan", async () => {
  assert.strictEqual((await run("!hola que tal")).handled, false);
  assert.strictEqual(sent.length, 0);
});

test("!comandos lista los atajos", async () => {
  const r = await run("!comandos");
  assert.match(r.text, /!fortuna/);
  assert.match(r.text, /!cuenta/);
});

test("fortuna con atajos al estilo SampDroid", async () => {
  await Economy.create({ Guild: G, User: U, Money: 80000, Bank: 0 });

  let r = await run("!fortuna");
  assert.match(r.embed.title, /Fortuna de tester/);
  assert.match(r.text, /80\.000/);

  r = await run("!trabajos");
  assert.match(r.embed.description, /Policía/);

  r = await run("!trabajar");
  assert.match(r.text, /No tienes oficio/);

  r = await run("!contrato mecánico");
  assert.match(r.embed.description, /Mecánico/);
  r = await run("!trabajar");
  assert.match(r.embed.description, /recibes/);
  r = await run("!trabajar");
  assert.match(r.text, /Debes esperar/);

  r = await run("!autos");
  assert.match(r.embed.description, /Infernus/);
  r = await run("!cauto sultan");
  assert.match(r.embed.description, /Compraste \*\*Sultan\*\*/);
  // Nombre de varias palabras y comando completo en español
  await Economy.updateOne({ Guild: G, User: U }, { $set: { Money: 200000 } });
  r = await run("!fortuna comprar casas casa en ganton");
  assert.match(r.embed.description, /Casa en Ganton/);
  r = await run("!fortuna comprar");
  assert.match(r.text, /Falta categoria/);
  r = await run("!vauto sultan");
  assert.match(r.embed.description, /Vendiste \*\*Sultan\*\*/);

  const assets = await Assets.find({ Guild: G, User: U }).lean();
  assert.deepStrictEqual(assets.map((a) => a.Item), ["ganton"]);
  assert.deepStrictEqual(errors, []);
});

test("economía y ayuda de una categoría", async () => {
  const before = (await Economy.findOne({ Guild: G, User: U })).Money;
  const r = await run("!depositar 1k");
  assert.ok(r.handled);
  const after = await Economy.findOne({ Guild: G, User: U });
  assert.strictEqual(after.Money, before - 1000);
  assert.strictEqual(after.Bank, 1000);

  const h = await run("!fortuna ayuda");
  assert.match(h.embed.description, /!fortuna asaltar/);
  const u = await run("!economia");
  assert.match(u.text, /Uso: !economia/);
});

test("/samp con !: perfil por nombre y el código de vincular llega por MD", async () => {
  const [p] = await db.query("SELECT name FROM player ORDER BY id LIMIT 1");
  let r = await run(`!cuenta ${p.name}`);
  assert.strictEqual(r.embed.title, `🎮・${p.name.replace(/_/g, "\\_")}`);

  r = await run(`!vincular ${p.name}`);
  const dm = sent.find((m) => m.where === "dm");
  assert.ok(dm, "el código tiene que llegar por MD");
  assert.match(dm.payload.content, /\/vincular [A-Z0-9]{6}/);
  await db.query("DELETE FROM discord_link_codes WHERE discord_id = ?", [U]);
  assert.deepStrictEqual(errors, []);
});
