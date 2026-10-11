/*
 * Códigos del stream (src/handlers/functions/streamCodes.js): anuncia una sola vez en el canal de TikTok los códigos
 * que se reclamaron en el juego (tabla stream_codes de gamemodes/src/stream_codigo.pwn), con Discord falso y la base local.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const Discord = require("discord.js");
const db = require("../src/database/mysql");
const samp = require("../src/database/samp");
const streamCodes = require("../src/handlers/functions/streamCodes");

samp.isAvailable = async () => true; // la base de pruebas no tiene las tablas del juego
const sent = [];
const tiktok = { id: "c1", name: "🎵┆tiktok", type: Discord.ChannelType.GuildText, rawPosition: 0, send: async (m) => (sent.push(m), m) };
const otro = { id: "c2", name: "💬┆chat", type: Discord.ChannelType.GuildText, rawPosition: 1, send: async () => assert.fail("no va al chat") };
const guild = { id: "g", name: "prueba", iconURL: () => null, channels: { cache: new Discord.Collection([["c1", tiktok], ["c2", otro]]) } };
const client = { guilds: { cache: new Map([["g", guild]]) } };

test.before(async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS stream_codes (id INT NOT NULL AUTO_INCREMENT, code VARCHAR(12) NOT NULL,
    created_by VARCHAR(24) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, claimed_by_id INT NULL,
    claimed_by_name VARCHAR(24) NULL, claimed_at DATETIME NULL, prize INT NOT NULL DEFAULT 0, announced TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id), KEY pending (announced, claimed_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query("DELETE FROM stream_codes WHERE created_by = 'Prueba_Test'");
});
test.after(async () => {
  await db.query("DELETE FROM stream_codes WHERE created_by = 'Prueba_Test'");
  await db.close();
});

test("anuncia una vez los códigos reclamados y no los que siguen activos", async () => {
  await db.query("INSERT INTO stream_codes (code, created_by, prize) VALUES ('ACTIVO', 'Prueba_Test', 10000)");
  await db.query("INSERT INTO stream_codes (code, created_by, prize, claimed_by_id, claimed_by_name, claimed_at) VALUES ('K7PX2Q', 'Prueba_Test', 10000, 5, 'Juan_Becker', NOW())");

  assert.strictEqual(await streamCodes.revisar(client), 1);
  assert.strictEqual(sent.length, 1);
  const e = sent[0].embeds[0].toJSON();
  assert.match(e.description, /Juan_Becker/);
  assert.match(e.description, /K7PX2Q/);
  assert.match(e.description, /TikTok/);
  assert.match(e.description, /\$10\.000/);

  assert.strictEqual(await streamCodes.revisar(client), 0); // ya anunciado
  assert.strictEqual(sent.length, 1);
  const [activo] = await db.query("SELECT announced FROM stream_codes WHERE code = 'ACTIVO' AND created_by = 'Prueba_Test'");
  assert.strictEqual(activo.announced, 0);
});
