/*
 * Tienda Tebex contra una copia de la base de datos del servidor (s107_Samp.sql cargado) y una API de Tebex falsa.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const db = require("../src/database/mysql");
const tebex = require("../src/database/tebex");
const { TebexQueue, logEmbed } = require("../src/tebex/queue");

const BASE_ID = 900000000 + Math.floor(Math.random() * 1000000);
let player;
let api;
let apiUrl;
const notices = [];
// Estado de la API falsa
const fake = { secret: "clave", offline: [], online: {}, players: [], deleted: [], nextCheck: 90 };

test.before(async () => {
  await tebex.init();
  [player] = await db.query("SELECT id, name FROM player ORDER BY id LIMIT 1");
  api = http.createServer((req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(body === undefined ? "" : JSON.stringify(body));
    };
    if (req.headers["x-tebex-secret"] !== fake.secret) return send(403, { error_message: "Invalid secret" });
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (req.method === "GET" && req.url === "/queue") return send(200, { meta: { next_check: fake.nextCheck }, players: fake.players });
      if (req.method === "GET" && req.url === "/queue/offline-commands") return send(200, { meta: { limited: false }, commands: fake.offline });
      const m = req.url.match(/^\/queue\/online-commands\/(\d+)$/);
      if (req.method === "GET" && m) return send(200, { commands: fake.online[m[1]] || [] });
      if (req.method === "DELETE" && req.url === "/queue") {
        fake.deleted.push(...JSON.parse(raw).ids);
        return send(204);
      }
      send(404, {});
    });
  });
  await new Promise((r) => api.listen(0, "127.0.0.1", r));
  apiUrl = `http://127.0.0.1:${api.address().port}`;
});

test.after(async () => {
  await db.query("DELETE FROM tebex_commands WHERE command_id >= ?", [BASE_ID]);
  await db.query("DELETE FROM discord_actions WHERE reason LIKE 'Tebex pago % / comando 9________'");
  api.close();
  await db.close();
});

const queue = (secret = fake.secret) => new TebexQueue({ secret, api: apiUrl, notify: async (e) => notices.push(e) });

test("comandos de los paquetes", () => {
  assert.deepStrictEqual(tebex.parseCommand("coins Juan_Perez 100"), { action: "coins", name: "Juan_Perez", value: 100 });
  assert.deepStrictEqual(tebex.parseCommand("/VIP Juan_Perez 30"), { action: "vip", name: "Juan_Perez", value: 30 });
  assert.strictEqual(tebex.parseCommand("coins Juan_Perez"), null);
  assert.strictEqual(tebex.parseCommand("coins Juan_Perez 0"), null);
  assert.strictEqual(tebex.parseCommand("give Juan 5"), null);
});

test("entrega coins, VIP y comandos de jugador conectado; una sola vez", async () => {
  fake.offline = [
    { id: BASE_ID + 1, command: `coins ${player.name} 250`, payment: 555, player: { name: player.name } },
    { id: BASE_ID + 2, command: `vip ${player.name} 30`, payment: 555, player: { name: player.name } },
  ];
  fake.players = [{ id: 77, name: player.name }];
  fake.online = { 77: [{ id: BASE_ID + 3, command: `coins ${player.name} 50`, payment: 556 }] };
  fake.deleted = [];

  const r = await queue().poll();
  assert.strictEqual(r.delivered, 3);
  assert.strictEqual(r.wait, 90);
  assert.deepStrictEqual(fake.deleted.sort(), [BASE_ID + 1, BASE_ID + 2, BASE_ID + 3]);

  const actions = await db.query(
    "SELECT action, value, done, by_name FROM discord_actions WHERE reason IN (?, ?, ?) ORDER BY id",
    [1, 2, 3].map((n) => `Tebex pago ${n === 3 ? 556 : 555} / comando ${BASE_ID + n}`),
  );
  // Primero los del jugador conectado y luego los demás
  assert.deepStrictEqual(actions.map((a) => [a.action, a.value, a.done, a.by_name]), [
    ["coins", 50, 0, player.name],
    ["coins", 250, 0, player.name],
    ["vip", 30, 0, player.name],
  ]);
  assert.match(notices.at(-1).title, /entregada/);

  // Si el borrado de la cola falló, Tebex los vuelve a mandar: no se entregan otra vez ni se avisa
  const n = notices.length;
  await queue().poll();
  const again = await db.query(
    "SELECT COUNT(*) AS n FROM discord_actions WHERE reason IN (?, ?, ?)",
    [1, 2, 3].map((n) => `Tebex pago ${n === 3 ? 556 : 555} / comando ${BASE_ID + n}`),
  );
  assert.strictEqual(Number(again[0].n), 3);
  assert.strictEqual(notices.length, n);
});

test("cuenta inexistente y comando desconocido: se registran y se avisa al staff", async () => {
  fake.players = [];
  fake.offline = [
    { id: BASE_ID + 10, command: "coins No_Existe_Nadie_999 100", payment: 600 },
    { id: BASE_ID + 11, command: "darcoins algo", payment: 601 },
  ];
  await queue().poll();
  const rows = await db.query("SELECT command_id, status, player_id FROM tebex_commands WHERE command_id IN (?, ?) ORDER BY command_id", [BASE_ID + 10, BASE_ID + 11]);
  assert.deepStrictEqual(rows.map((r) => [Number(r.command_id), r.status, r.player_id]), [
    [BASE_ID + 10, "no_account", null],
    [BASE_ID + 11, "unknown", null],
  ]);
  assert.match(notices.at(-2).title, /no existe la cuenta/);
  assert.match(notices.at(-1).title, /no reconocido/);
});

test("login de Discord: entrega a la cuenta vinculada o espera a que la vincule", async () => {
  const linkedId = "111111111111111111";
  const loneId = "222222222222222222";
  await db.query("DELETE FROM discord_links WHERE discord_id IN (?, ?) OR player_id = ?", [linkedId, loneId, player.id]);
  await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [player.id, linkedId]);
  try {
    fake.players = [];
    fake.deleted = [];
    fake.offline = [
      { id: BASE_ID + 20, command: `coins ${linkedId} 75`, payment: 700 },
      { id: BASE_ID + 21, command: `vip ${loneId} 30`, payment: 701 },
    ];
    const dms = [];
    const q = new TebexQueue({ secret: fake.secret, api: apiUrl, notify: async (e) => notices.push(e), notifyUser: async (id) => dms.push(id) });

    await q.poll();
    // El vinculado recibe; el otro se queda en la cola de Tebex y se le avisa una sola vez
    assert.deepStrictEqual(fake.deleted, [BASE_ID + 20]);
    const [row] = await db.query("SELECT player_id, status FROM tebex_commands WHERE command_id = ?", [BASE_ID + 20]);
    assert.deepStrictEqual([Number(row.player_id), row.status], [Number(player.id), "delivered"]);
    assert.strictEqual((await db.query("SELECT 1 FROM tebex_commands WHERE command_id = ?", [BASE_ID + 21])).length, 0);
    assert.deepStrictEqual(dms, [loneId]);
    assert.match(notices.at(-1).title, /en espera/);

    fake.offline = [fake.offline[1]];
    await q.poll();
    assert.deepStrictEqual(dms, [loneId]);

    // Lo vincula: en la siguiente vuelta se entrega
    await db.query("DELETE FROM discord_links WHERE player_id = ?", [player.id]);
    await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [player.id, loneId]);
    await q.poll();
    assert.ok(fake.deleted.includes(BASE_ID + 21));
    const [vip] = await db.query("SELECT action, value FROM discord_actions WHERE reason = ?", [`Tebex pago 701 / comando ${BASE_ID + 21}`]);
    assert.deepStrictEqual([vip.action, vip.value], ["vip", 30]);
  } finally {
    await db.query("DELETE FROM discord_links WHERE discord_id IN (?, ?)", [linkedId, loneId]);
  }
});

test("clave incorrecta: error claro y no se entrega nada", async () => {
  await assert.rejects(queue("mala").poll(), /HTTP 403/);
});

test("respeta un mínimo de espera", async () => {
  fake.offline = [];
  fake.nextCheck = 1;
  assert.strictEqual((await queue().poll()).wait, 30);
});

test("embed de compra entregada", () => {
  const e = logEmbed({ status: "delivered", action: "vip", value: 30, username: "A_B", player: { id: 1, name: "A_B" }, paymentId: 5, command: "vip A_B 30" });
  assert.ok(e.fields.some((f) => /VIP \*\*30\*\* días/.test(f.value)));
});
