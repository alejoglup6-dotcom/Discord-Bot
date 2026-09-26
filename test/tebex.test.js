/*
 * Webhook de Tebex contra una copia de la base de datos del servidor (s107_Samp.sql cargado).
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const db = require("../src/database/mysql");
const tebex = require("../src/database/tebex");
const { createServer, sign, validSignature, logEmbed } = require("../src/tebex/server");

const SECRET = "secreto-de-prueba";
const TXN = "tbx-test-" + Date.now();
let player;
let server;
let port;
const notices = [];

async function post(event, { secret = SECRET } = {}) {
  const body = JSON.stringify(event);
  const res = await fetch(`http://127.0.0.1:${port}/tebex`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": sign(body, secret) },
    body,
  });
  return { status: res.status, body: await res.json() };
}

function payment(txn, username, products) {
  return {
    id: "evt-" + txn,
    type: "payment.completed",
    subject: {
      transaction_id: txn,
      price: { amount: 12.5, currency: "USD" },
      customer: { email: "cliente@example.com", username: { id: "1", username } },
      products: products.map(([name, quantity]) => ({ name, quantity, username: { id: "1", username } })),
    },
  };
}

test.before(async () => {
  await tebex.init();
  [player] = await db.query("SELECT id, name, coins FROM player ORDER BY id LIMIT 1");
  server = createServer({ secret: SECRET, checkIp: false, notify: async (e) => notices.push(e) });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});

test.after(async () => {
  await db.query("DELETE FROM tebex_payments WHERE transaction_id LIKE 'tbx-test-%'");
  await db.query("DELETE FROM discord_actions WHERE reason LIKE 'Tebex tbx-test-%'");
  server.close();
  await db.close();
});

test("nombres de paquetes", () => {
  assert.deepStrictEqual(tebex.parsePackage("100 Coins"), { coins: 100, vipDays: 0 });
  assert.deepStrictEqual(tebex.parsePackage("Pack 250 RoleCoins"), { coins: 250, vipDays: 0 });
  assert.deepStrictEqual(tebex.parsePackage("1.000 Coins"), { coins: 1000, vipDays: 0 });
  assert.deepStrictEqual(tebex.parsePackage("VIP 60 días"), { coins: 0, vipDays: 60 });
  assert.deepStrictEqual(tebex.parsePackage("Membresía VIP"), { coins: 0, vipDays: 30 });
  assert.strictEqual(tebex.parsePackage("Camiseta"), null);
});

test("firma de Tebex", () => {
  const body = '{"a":1}';
  assert.ok(validSignature(Buffer.from(body), sign(body, SECRET), SECRET));
  assert.ok(!validSignature(Buffer.from(body), sign(body, "otra"), SECRET));
  assert.ok(!validSignature(Buffer.from(body), undefined, SECRET));
});

test("rechaza firmas malas y responde la validación", async () => {
  const bad = await post({ id: "x", type: "validation.webhook" }, { secret: "otra" });
  assert.strictEqual(bad.status, 403);
  const ok = await post({ id: "abc-123", type: "validation.webhook" });
  assert.deepStrictEqual(ok, { status: 200, body: { id: "abc-123" } });
});

test("solo IPs de Tebex", async () => {
  const strict = createServer({ secret: SECRET });
  await new Promise((r) => strict.listen(0, "127.0.0.1", r));
  const res = await fetch(`http://127.0.0.1:${strict.address().port}/tebex`, { method: "POST", body: "{}" });
  assert.strictEqual(res.status, 403);
  strict.close();
});

test("pago completado: deja coins y VIP para el gamemode, una sola vez", async () => {
  const txn = TXN + "-a";
  const event = payment(txn, player.name, [["100 Coins", 2], ["VIP 30 días", 1]]);
  const r = await post(event);
  assert.strictEqual(r.status, 200);

  const [row] = await db.query("SELECT * FROM tebex_payments WHERE transaction_id = ?", [txn]);
  assert.strictEqual(row.status, "delivered");
  assert.strictEqual(Number(row.player_id), Number(player.id));
  assert.strictEqual(row.coins, 200);
  assert.strictEqual(row.vip_days, 30);

  const actions = await db.query("SELECT action, value, done FROM discord_actions WHERE reason = ? ORDER BY action", ["Tebex " + txn]);
  assert.deepStrictEqual(actions.map((a) => [a.action, a.value, a.done]), [["coins", 200, 0], ["vip", 30, 0]]);
  assert.match(notices.at(-1).title, /entregada/);

  // Tebex reintenta el mismo pago: no se entrega dos veces ni se vuelve a avisar
  const n = notices.length;
  assert.strictEqual((await post(event)).status, 200);
  assert.strictEqual(Number((await db.query("SELECT COUNT(*) AS n FROM discord_actions WHERE reason = ?", ["Tebex " + txn]))[0].n), 2);
  assert.strictEqual(notices.length, n);
});

test("cuenta que no existe: se registra y se avisa al staff", async () => {
  const txn = TXN + "-b";
  await post(payment(txn, "No_Existe_Nadie_999", [["50 Coins", 1]]));
  const [row] = await db.query("SELECT status, player_id FROM tebex_payments WHERE transaction_id = ?", [txn]);
  assert.strictEqual(row.status, "no_account");
  assert.strictEqual(row.player_id, null);
  assert.match(notices.at(-1).title, /no existe la cuenta/);
});

test("reembolso: marca el pago y avisa", async () => {
  const txn = TXN + "-a";
  await post({ id: "r1", type: "payment.refunded", subject: { transaction_id: txn } });
  const [row] = await db.query("SELECT status FROM tebex_payments WHERE transaction_id = ?", [txn]);
  assert.strictEqual(row.status, "refunded");
  assert.match(notices.at(-1).title, /payment.refunded/);
});

test("embed de paquete desconocido", () => {
  const e = logEmbed({ kind: "payment", status: "nothing", username: "A_B", player: { id: 1, name: "A_B" }, coins: 0, vipDays: 0, unknown: ["Camiseta"], products: ["1x Camiseta"], transactionId: "t", amount: 1, currency: "USD" });
  assert.match(e.title, /no reconocido/);
  assert.ok(e.fields.some((f) => /Camiseta/.test(f.value)));
});
