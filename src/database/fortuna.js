/*
 * Fortuna: minijuego de economía de Discord (oficios, propiedades, armas y asaltos).
 * Usa el dinero de /economy (modelo economy: Money = efectivo, Bank = banco) y no toca nada del juego.
 * El catálogo (precios, sueldos, esperas) está en src/assets/data/fortuna.js.
 */
const Economy = require("./models/economy");
const Fortuna = require("./models/fortuna");
const Assets = require("./models/fortunaAssets");
const catalog = require("../assets/data/fortuna");

const HOUR = 3600000;
const MINUTE = 60000;

function rand([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function wallet(guild, user) {
  const w = await Economy.findOne({ Guild: guild, User: user }).lean();
  return { money: Number(w?.Money) || 0, bank: Number(w?.Bank) || 0 };
}

// Suma (o resta con un número negativo) efectivo de forma atómica
async function addMoney(guild, user, amount) {
  const w = await Economy.findOneAndUpdate(
    { Guild: guild, User: user },
    { $inc: { Money: amount }, $setOnInsert: { Bank: 0 } },
    { upsert: true, new: true },
  ).lean();
  return Number(w.Money) || 0;
}

// Cobra efectivo solo si alcanza; devuelve false si no
async function takeMoney(guild, user, amount) {
  const w = await Economy.findOneAndUpdate(
    { Guild: guild, User: user, Money: { $gte: amount } },
    { $inc: { Money: -amount } },
    { new: true },
  ).lean();
  return Boolean(w);
}

async function profile(guild, user) {
  return Fortuna.findOneAndUpdate(
    { Guild: guild, User: user },
    { $setOnInsert: { Job: null, LastWork: 0, LastHeist: 0, Shifts: 0, Earned: 0 } },
    { upsert: true, new: true },
  ).lean();
}

async function assets(guild, user) {
  return Assets.find({ Guild: guild, User: user }).sort({ BoughtAt: 1 }).lean();
}

function count(list, category) {
  return list.filter((a) => a.Category === category).length;
}

// Ganancias acumuladas de las propiedades (máximo MAX_INCOME_HOURS horas por propiedad)
function pendingIncome(list, now = Date.now()) {
  let total = 0;
  for (const a of list) {
    const item = catalog.getItem(a.Category, a.Item);
    if (!item?.income) continue;
    const hours = Math.min(catalog.MAX_INCOME_HOURS, Math.max(0, now - (a.LastCollect || a.BoughtAt)) / HOUR);
    total += Math.floor(hours * item.income);
  }
  return total;
}

function incomePerHour(list) {
  return list.reduce((sum, a) => sum + (catalog.getItem(a.Category, a.Item)?.income || 0), 0);
}

function bestWeapon(list) {
  return list
    .filter((a) => a.Category === "armas")
    .map((a) => catalog.getItem("armas", a.Item))
    .filter(Boolean)
    .sort((a, b) => b.bonus - a.bonus)[0] || null;
}

async function overview(guild, user) {
  const [w, p, list] = await Promise.all([wallet(guild, user), profile(guild, user), assets(guild, user)]);
  const value = list.reduce((sum, a) => sum + (Number(a.Price) || 0), 0);
  return {
    money: w.money,
    bank: w.bank,
    job: p.Job ? catalog.findJob(p.Job) : null,
    shifts: p.Shifts || 0,
    earned: p.Earned || 0,
    counts: Object.fromEntries(Object.keys(catalog.CATEGORIES).map((c) => [c, count(list, c)])),
    assets: list,
    incomePerHour: incomePerHour(list),
    pending: pendingIncome(list),
    propertiesValue: value,
    total: w.money + w.bank + value,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Oficios

async function contract(guild, user, jobQuery) {
  const job = catalog.findJob(jobQuery);
  if (!job) return { error: "no_job" };
  const p = await profile(guild, user);
  if (p.Job === job.id) return { error: "same_job", job };
  if (p.Job) return { error: "has_job", job: catalog.findJob(p.Job) };
  const list = await assets(guild, user);
  const missing = Object.entries(job.needs || {}).filter(([cat, n]) => count(list, cat) < n);
  if (missing.length) return { error: "needs", job, missing: missing.map(([cat]) => catalog.CATEGORIES[cat]) };
  await Fortuna.updateOne({ Guild: guild, User: user }, { $set: { Job: job.id, JobSince: Date.now(), LastWork: 0 } });
  return { job };
}

async function resign(guild, user) {
  const p = await profile(guild, user);
  if (!p.Job) return { error: "no_contract" };
  await Fortuna.updateOne({ Guild: guild, User: user }, { $set: { Job: null } });
  return { job: catalog.findJob(p.Job) };
}

async function work(guild, user, now = Date.now()) {
  const p = await profile(guild, user);
  const job = p.Job ? catalog.findJob(p.Job) : null;
  if (!job) return { error: "no_contract" };
  const cooldown = job.cooldown * MINUTE;
  // Se reserva el turno de forma atómica: dos mensajes a la vez no cobran dos veces
  const claimed = await Fortuna.findOneAndUpdate(
    { Guild: guild, User: user, LastWork: { $lte: now - cooldown } },
    { $set: { LastWork: now } },
    { new: true },
  ).lean();
  if (!claimed) return { error: "cooldown", job, wait: Math.ceil((p.LastWork + cooldown - now) / 1000) };
  const pay = rand(job.pay);
  await Fortuna.updateOne({ Guild: guild, User: user }, { $inc: { Shifts: 1, Earned: pay } });
  const money = await addMoney(guild, user, pay);
  return { job, pay, money };
}

// ---------------------------------------------------------------------------------------------------------------
// Propiedades y armas

async function buy(guild, user, categoryQuery, itemQuery) {
  const category = catalog.findCategory(categoryQuery);
  if (!category) return { error: "no_category" };
  const item = catalog.findItem(category.id, itemQuery);
  if (!item) return { error: "no_item", category };
  const now = Date.now();
  // Se crea la fila solo si no la tenía (atómico); si ya existía, no se cobra
  const before = await Assets.findOneAndUpdate(
    { Guild: guild, User: user, Category: category.id, Item: item.id },
    { $setOnInsert: { Price: item.price, BoughtAt: now, LastCollect: now } },
    { upsert: true },
  ).lean();
  if (before) return { error: "owned", category, item };
  if (!(await takeMoney(guild, user, item.price))) {
    await Assets.deleteOne({ Guild: guild, User: user, Category: category.id, Item: item.id });
    const w = await wallet(guild, user);
    return { error: "no_money", category, item, missing: item.price - w.money };
  }
  return { category, item, money: (await wallet(guild, user)).money };
}

async function sell(guild, user, categoryQuery, itemQuery) {
  const category = catalog.findCategory(categoryQuery);
  if (!category) return { error: "no_category" };
  const item = catalog.findItem(category.id, itemQuery);
  if (!item) return { error: "no_item", category };
  const asset = await Assets.findOneAndDelete({ Guild: guild, User: user, Category: category.id, Item: item.id }).lean();
  if (!asset) return { error: "not_owned", category, item };
  // Lo que había sin cobrar de esa propiedad se paga junto con la venta
  const pending = pendingIncome([asset]);
  const price = Math.floor((Number(asset.Price) || item.price) * catalog.SELL_RATE);
  const money = await addMoney(guild, user, price + pending);
  return { category, item, price, pending, money };
}

async function collect(guild, user, now = Date.now()) {
  const list = (await assets(guild, user)).filter((a) => catalog.getItem(a.Category, a.Item)?.income);
  if (!list.length) return { error: "no_income" };
  let total = 0;
  for (const a of list) {
    const amount = pendingIncome([a], now);
    if (amount <= 0) continue;
    // Solo cobra quien actualiza LastCollect primero (dos cobros a la vez no pagan doble)
    const res = await Assets.updateOne({ _id: a._id, LastCollect: a.LastCollect }, { $set: { LastCollect: now } });
    if (res.modifiedCount) total += amount;
  }
  if (total <= 0) return { error: "nothing", perHour: incomePerHour(list) };
  const money = await addMoney(guild, user, total);
  return { total, money, perHour: incomePerHour(list) };
}

async function heist(guild, user, now = Date.now()) {
  const list = await assets(guild, user);
  const weapon = bestWeapon(list);
  if (!weapon) return { error: "no_weapon" };
  const p = await profile(guild, user);
  const cooldown = catalog.HEIST_COOLDOWN * MINUTE;
  const claimed = await Fortuna.findOneAndUpdate(
    { Guild: guild, User: user, LastHeist: { $lte: now - cooldown } },
    { $set: { LastHeist: now } },
    { new: true },
  ).lean();
  if (!claimed) return { error: "cooldown", wait: Math.ceil((p.LastHeist + cooldown - now) / 1000) };

  const target = catalog.HEISTS[Math.floor(Math.random() * catalog.HEISTS.length)];
  const chance = Math.min(90, target.base + weapon.bonus);
  if (Math.random() * 100 < chance) {
    const loot = rand(target.reward);
    const money = await addMoney(guild, user, loot);
    return { success: true, target, weapon, chance, loot, money };
  }
  // Multa: se paga con lo que tenga en efectivo
  const w = await wallet(guild, user);
  const fine = Math.min(w.money, rand(catalog.HEIST_FINE));
  const money = fine > 0 ? await addMoney(guild, user, -fine) : w.money;
  return { success: false, target, weapon, chance, fine, money };
}

module.exports = {
  wallet,
  addMoney,
  takeMoney,
  profile,
  assets,
  overview,
  contract,
  resign,
  work,
  buy,
  sell,
  collect,
  heist,
  pendingIncome,
  bestWeapon,
};
