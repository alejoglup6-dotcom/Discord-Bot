/*
 * Canal de alianzas: el bot vuelve a publicar la plantilla y borra el mensaje original. Con mensajes falsos.
 */
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const Discord = require("discord.js");
const { isAllianceChannel, splitMessage, repostAlliance, LIMIT } = require("../src/assets/utils/alliances");

function fakeMessage({ content = "", attachments = [], bot = false, channelName = "🤝┆alianzas", perms = true } = {}) {
  const sent = [];
  const msg = {
    author: { bot },
    system: false,
    content,
    deleted: false,
    attachments: new Discord.Collection(attachments.map((a, i) => [String(i), a])),
    guild: { members: { me: {} } },
    channel: {
      guild: {},
      name: channelName,
      type: Discord.ChannelType.GuildText,
      permissionsFor: () => ({ has: () => perms }),
      send: async (o) => {
        sent.push(o);
        return o;
      },
    },
    delete: async () => {
      msg.deleted = true;
    },
  };
  msg.channel.guild = msg.guild;
  return { msg, sent };
}

test("reconoce el canal de alianzas por su nombre", () => {
  const ch = (name, type = Discord.ChannelType.GuildText) => ({ guild: {}, name, type });
  assert.ok(isAllianceChannel(ch("🤝┆alianzas")));
  assert.ok(isAllianceChannel(ch("Alianzas")));
  assert.ok(!isAllianceChannel(ch("💬┆chat")));
  assert.ok(!isAllianceChannel(ch("alianzas", Discord.ChannelType.GuildVoice)));
});

test("parte los textos largos sin pasar del límite y sin perder nada", () => {
  const long = Array.from({ length: 300 }, (_, i) => `Línea ${i} de la plantilla con https://discord.gg/abc${i}`).join("\n");
  const parts = splitMessage(long);
  assert.ok(parts.length > 1);
  assert.ok(parts.every((p) => p.length <= LIMIT));
  assert.strictEqual(parts.join("\n"), long);
  const oneLine = "x".repeat(4500);
  const p2 = splitMessage(oneLine);
  assert.ok(p2.every((p) => p.length <= LIMIT));
  assert.strictEqual(p2.join(""), oneLine);
  assert.deepStrictEqual(splitMessage(""), []);
});

test("vuelve a publicar la plantilla sin avisar a nadie y borra el original", async () => {
  const content = "# 🤝 Alianza con Space LSX\n@everyone únete: https://discord.gg/abc";
  const { msg, sent } = fakeMessage({ content });
  assert.strictEqual(await repostAlliance(msg), true);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].content, content);
  assert.deepStrictEqual(sent[0].allowedMentions, { parse: [] });
  assert.ok(msg.deleted);
});

test("plantillas de más de 2000 caracteres (Nitro) se mandan en varias partes", async () => {
  const content = Array.from({ length: 120 }, (_, i) => `🔹 Punto ${i}: descripción del servidor aliado`).join("\n");
  const { msg, sent } = fakeMessage({ content });
  await repostAlliance(msg);
  assert.ok(sent.length > 1);
  assert.strictEqual(sent.map((s) => s.content).join("\n"), content);
  assert.ok(msg.deleted);
});

test("copia las imágenes adjuntas", async () => {
  const png = Buffer.from("imagen-de-prueba");
  const server = http.createServer((req, res) => res.end(png));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const url = `http://127.0.0.1:${server.address().port}/banner.png`;
    const { msg, sent } = fakeMessage({ content: "Alianza", attachments: [{ url, name: "banner.png" }] });
    await repostAlliance(msg);
    const file = sent.at(-1).files[0];
    assert.strictEqual(file.name, "banner.png");
    assert.deepStrictEqual(file.attachment, png);
    assert.ok(msg.deleted);
  } finally {
    server.close();
  }
});

test("si no se puede publicar la copia, el original no se borra", async () => {
  const { msg } = fakeMessage({ content: "Alianza" });
  msg.channel.send = async () => {
    throw new Error("Missing Permissions");
  };
  await assert.rejects(repostAlliance(msg));
  assert.ok(!msg.deleted);
});

test("no toca mensajes de bots, de otros canales, sin permisos o sin nada que copiar", async () => {
  for (const opts of [{ content: "x", bot: true }, { content: "x", channelName: "chat" }, { content: "x", perms: false }, { content: "" }]) {
    const { msg, sent } = fakeMessage(opts);
    assert.strictEqual(await repostAlliance(msg), false);
    assert.strictEqual(sent.length, 0);
    assert.ok(!msg.deleted);
  }
});
