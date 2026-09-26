/*
 * Pruebas de la Fortuna (src/database/fortuna.js) contra MySQL. Usa un servidor de Discord inventado y borra
 * sus filas al terminar.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const odm = require("../src/database/odm");
const fortuna = require("../src/database/fortuna");
const catalog = require("../src/assets/data/fortuna");
const Economy = require("../src/database/models/economy");
const Fortuna = require("../src/database/models/fortuna");
const Assets = require("../src/database/models/fortunaAssets");

const G = "test-guild-" + Date.now();
const U = "900000000000000010";
const HOUR = 3600000;

test.after(async () => {
  for (const m of [Economy, Fortuna, Assets]) await m.deleteMany({ Guild: G });
  await odm.close();
});

test("dinero: sumar y cobrar solo si alcanza", async () => {
  assert.strictEqual(await fortuna.addMoney(G, U, 1000), 1000);
  assert.strictEqual(await fortuna.takeMoney(G, U, 5000), false);
  assert.strictEqual(await fortuna.takeMoney(G, U, 400), true);
  assert.deepStrictEqual(await fortuna.wallet(G, U), { money: 600, bank: 0 });
});

test("oficios: requisitos, contrato, espera y sueldo", async () => {
  assert.strictEqual((await fortuna.work(G, U)).error, "no_contract");
  assert.strictEqual((await fortuna.contract(G, U, "inventado")).error, "no_job");
  const need = await fortuna.contract(G, U, "Taxista");
  assert.strictEqual(need.error, "needs");
  assert.strictEqual(need.missing[0].name, "Autos");

  assert.strictEqual((await fortuna.contract(G, U, "mecanico")).job.id, "mecanico");
  assert.strictEqual((await fortuna.contract(G, U, "médico")).error, "has_job");

  const before = (await fortuna.wallet(G, U)).money;
  const r = await fortuna.work(G, U);
  assert.ok(r.pay >= 700 && r.pay <= 1300, String(r.pay));
  assert.strictEqual(r.money, before + r.pay);
  const again = await fortuna.work(G, U);
  assert.strictEqual(again.error, "cooldown");
  assert.ok(again.wait > 800 && again.wait <= 900);

  // Dos turnos a la vez después de la espera: solo uno cobra
  const later = Date.now() + 16 * 60000;
  const both = await Promise.all([fortuna.work(G, U, later), fortuna.work(G, U, later)]);
  assert.strictEqual(both.filter((x) => x.pay).length, 1);

  assert.strictEqual((await fortuna.resign(G, U)).job.id, "mecanico");
  assert.strictEqual((await fortuna.resign(G, U)).error, "no_contract");
});

test("comprar y vender propiedades", async () => {
  await Economy.updateOne({ Guild: G, User: U }, { $set: { Money: 100000 } });
  assert.strictEqual((await fortuna.buy(G, U, "autos", "infernus")).error, "no_money");
  assert.strictEqual(await Assets.countDocuments({ Guild: G }), 0);

  const r = await fortuna.buy(G, U, "auto", "sult");
  assert.strictEqual(r.item.id, "sultan");
  assert.strictEqual(r.money, 45000);
  assert.strictEqual((await fortuna.buy(G, U, "autos", "sultan")).error, "owned");
  assert.strictEqual((await fortuna.wallet(G, U)).money, 45000);

  // Dos compras a la vez del mismo artículo: solo una cobra
  await Economy.updateOne({ Guild: G, User: U }, { $set: { Money: 100000 } });
  const both = await Promise.all([fortuna.buy(G, U, "casas", "ganton"), fortuna.buy(G, U, "casas", "ganton")]);
  assert.strictEqual(both.filter((x) => !x.error).length, 1);
  assert.strictEqual((await fortuna.wallet(G, U)).money, 40000);

  // Ahora puede ser taxista (tiene auto)
  assert.strictEqual((await fortuna.contract(G, U, "taxista")).job.id, "taxista");

  const s = await fortuna.sell(G, U, "autos", "sultan");
  assert.strictEqual(s.price, Math.floor(55000 * catalog.SELL_RATE));
  assert.strictEqual((await fortuna.sell(G, U, "autos", "sultan")).error, "not_owned");
});

test("cobrar ganancias acumuladas (máximo 24 horas)", async () => {
  // La casa de Ganton se compró hace 30 horas: se cobran 24
  await Assets.updateOne({ Guild: G, User: U, Item: "ganton" }, { $set: { LastCollect: Date.now() - 30 * HOUR } });
  const before = (await fortuna.wallet(G, U)).money;
  const r = await fortuna.collect(G, U);
  assert.strictEqual(r.total, 24 * 150);
  assert.strictEqual(r.money, before + 24 * 150);
  assert.strictEqual((await fortuna.collect(G, U)).error, "nothing");
});

test("asaltos: hace falta un arma, hay espera y paga o multa", async () => {
  assert.strictEqual((await fortuna.heist(G, U)).error, "no_weapon");
  await fortuna.addMoney(G, U, 10000);
  await fortuna.buy(G, U, "armas", "ak47");
  await fortuna.buy(G, U, "armas", "bate");
  const r = await fortuna.heist(G, U);
  assert.strictEqual(r.weapon.id, "ak47");
  assert.ok(r.success ? r.loot > 0 : r.fine >= 0);
  assert.strictEqual((await fortuna.heist(G, U)).error, "cooldown");
});

test("resumen de la fortuna", async () => {
  const o = await fortuna.overview(G, U);
  assert.strictEqual(o.counts.casas, 1);
  assert.strictEqual(o.counts.armas, 2);
  assert.strictEqual(o.job.id, "taxista");
  assert.strictEqual(o.incomePerHour, 150);
  assert.strictEqual(o.propertiesValue, 60000 + 65000 + 1500);
  assert.strictEqual(o.total, o.money + o.bank + o.propertiesValue);
});
