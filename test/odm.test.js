/*
 * Pruebas de la capa MySQL (src/database/odm.js) contra una base de datos real.
 *   MYSQL_HOST=... MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... node --test test/
 * Crea tablas bot_test_* y las borra al terminar.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const odm = require("../src/database/odm");

const suffix = Date.now().toString(36);
const Levels = odm.model(`test_levels_${suffix}`, new odm.Schema({
  userID: { type: String },
  guildID: { type: String },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: new Date() },
}));
const Functions = odm.model(`test_functions_${suffix}`, new odm.Schema({
  Guild: String,
  Levels: { type: Boolean, default: false },
  Prefix: String,
}));
const Family = odm.model(`test_family_${suffix}`, new odm.Schema({
  Guild: String,
  User: String,
  Parent: { type: Array, default: null },
  Children: { type: Array, default: null },
  Tags: Array,
}));
const Temp = odm.model(`test_tempban_${suffix}`, new odm.Schema({ guildId: String, userId: String, expires: Date }));
const Give = odm.model(`test_giveaways_${suffix}`, new odm.Schema({
  messageId: String,
  ended: Boolean,
  prize: String,
  messages: { giveaway: String, winMessage: odm.Mixed },
  winnerIds: { type: [String], default: undefined },
}));

test.after(async () => {
  for (const m of [Levels, Functions, Family, Temp, Give]) await odm.db.query(`DROP TABLE IF EXISTS \`${m.table}\``);
  await odm.close();
});

test("crear, buscar y guardar documentos", async () => {
  const d = new Levels({ userID: "1", guildID: "g1", xp: "15" });
  assert.strictEqual(d.xp, 15);
  assert.strictEqual(d.level, 0);
  assert.ok(d.lastUpdated instanceof Date);
  assert.strictEqual(d.isNew, true);
  await d.save();
  assert.strictEqual(d.isNew, false);
  assert.ok(d._id > 0);

  const found = await Levels.findOne({ userID: "1", guildID: "g1" });
  assert.strictEqual(found.xp, 15);
  assert.ok(found.lastUpdated instanceof Date);
  found.xp += 10;
  found.level = 2;
  await found.save();
  const again = await Levels.findOne({ userID: "1", guildID: "g1" }).lean();
  assert.deepStrictEqual([again.xp, again.level], [25, 2]);
  assert.strictEqual(typeof again.save, "undefined");
  assert.strictEqual(await Levels.findOne({ userID: "nadie" }), null);
  // números en el filtro se convierten a texto, como en mongoose
  assert.ok(await Levels.findOne({ userID: 1, guildID: "g1" }));
});

test("save solo escribe los campos cambiados", async () => {
  const a = await Levels.findOne({ userID: "1" });
  const b = await Levels.findOne({ userID: "1" });
  a.xp = 100;
  b.level = 9;
  await a.save();
  await b.save();
  const r = await Levels.findOne({ userID: "1" }).lean();
  assert.deepStrictEqual([r.xp, r.level], [100, 9]);
});

test("orden, límite, salto y $in", async () => {
  await Levels.create([
    { userID: "2", guildID: "g1", xp: 50 },
    { userID: "3", guildID: "g1", xp: 300 },
    { userID: "4", guildID: "g2", xp: 999 },
  ]);
  const top = await Levels.find({ guildID: "g1" }).sort([["xp", "descending"]]).exec();
  assert.deepStrictEqual(top.map((x) => x.userID), ["3", "1", "2"]);
  const top2 = await Levels.find({ guildID: "g1" }).sort({ xp: -1 }).skip(1).limit(1);
  assert.deepStrictEqual(top2.map((x) => x.userID), ["1"]);
  const sorted = await Levels.find({}).sort("-xp").lean();
  assert.strictEqual(sorted[0].userID, "4");
  const some = await Levels.find({ guildID: "g1", userID: { $in: ["2", "3", "9"] } }).lean();
  assert.deepStrictEqual(some.map((x) => x.userID).sort(), ["2", "3"]);
  assert.strictEqual(await Levels.countDocuments({ guildID: "g1" }), 3);
  const gt = await Levels.find({ xp: { $gte: 100, $lt: 999 } }).lean();
  assert.deepStrictEqual(gt.map((x) => x.userID).sort(), ["1", "3"]);
});

test("findOneAndUpdate con upsert, $setOnInsert, $set e $inc", async () => {
  const s = await Functions.findOneAndUpdate({ Guild: "g1" }, { $setOnInsert: { Prefix: "!" } }, { new: true, upsert: true }).lean().exec();
  assert.deepStrictEqual([s.Guild, s.Prefix, s.Levels], ["g1", "!", false]);
  const s2 = await Functions.findOneAndUpdate({ Guild: "g1" }, { $setOnInsert: { Prefix: "?" } }, { new: true, upsert: true }).lean();
  assert.strictEqual(s2.Prefix, "!");
  assert.strictEqual(await Functions.countDocuments({ Guild: "g1" }), 1);
  const before = await Functions.findOneAndUpdate({ Guild: "g1" }, { Levels: true });
  assert.strictEqual(before.Levels, false);
  const r = await Functions.updateOne({ Guild: "g1" }, { $set: { Prefix: "." } });
  assert.strictEqual(r.modifiedCount, 1);
  assert.strictEqual((await Functions.findOne({ Guild: "g1" })).Prefix, ".");

  const inc = await Levels.findOneAndUpdate({ userID: "2", guildID: "g1" }, { $inc: { xp: 5 } }, { new: true });
  assert.strictEqual(inc.xp, 55);
  const none = await Levels.findOneAndUpdate({ userID: "x" }, { $inc: { xp: 5 } }, { new: true });
  assert.strictEqual(none, null);
});

test("$inc concurrente no pierde incrementos", async () => {
  await Levels.create({ userID: "c", guildID: "g9", xp: 0 });
  await Promise.all(Array.from({ length: 20 }, () => Levels.findOneAndUpdate({ userID: "c", guildID: "g9" }, { $inc: { xp: 1 } })));
  assert.strictEqual((await Levels.findOne({ userID: "c" })).xp, 20);
});

test("arrays: push, pull, filtros sobre arrays y defaults null", async () => {
  const f = await new Family({ Guild: "g1", User: "u1" }).save();
  assert.strictEqual(f.Parent, null);
  assert.deepStrictEqual(f.Tags, []);
  f.Children = ["a"];
  f.Children.push("b");
  f.Tags.push("x");
  await f.save();
  const got = await Family.findOne({ Guild: "g1", User: "u1" });
  assert.deepStrictEqual(got.Children, ["a", "b"]);
  assert.ok(await Family.findOne({ Children: "b" }));
  await Family.updateOne({ User: "u1" }, { $pull: { Children: "a" }, $push: { Tags: { $each: ["y", "z"] } } });
  const g2 = await Family.findOne({ User: "u1" }).lean();
  assert.deepStrictEqual(g2.Children, ["b"]);
  assert.deepStrictEqual(g2.Tags, ["x", "y", "z"]);
});

test("fechas y $lt (tempban)", async () => {
  await Temp.create({ guildId: "g", userId: "old", expires: new Date(Date.now() - 60000) });
  await Temp.create({ guildId: "g", userId: "new", expires: new Date(Date.now() + 60000) });
  const cond = { expires: { $lt: new Date() } };
  const res = await Temp.find(cond);
  assert.deepStrictEqual(res.map((r) => r.userId), ["old"]);
  const del = await Temp.deleteMany(cond);
  assert.strictEqual(del.deletedCount, 1);
  assert.strictEqual(await Temp.countDocuments({}), 1);
});

test("borrar: deleteOne, findOneAndDelete, doc.deleteOne", async () => {
  const d = await Levels.findOneAndDelete({ userID: "4" });
  assert.strictEqual(d.xp, 999);
  assert.strictEqual(await Levels.findOne({ userID: "4" }), null);
  const doc = await Levels.findOne({ userID: "3" });
  await doc.deleteOne();
  assert.strictEqual(await Levels.findOne({ userID: "3" }), null);
  const r = await Levels.deleteOne({ userID: "2" });
  assert.strictEqual(r.deletedCount, 1);
  // deleteMany con un campo que el modelo no tiene no borra nada (guildDelete)
  assert.strictEqual((await Levels.deleteMany({ Guild: "g1" })).deletedCount, 0);
});

test("objetos anidados, Mixed y el paquete de sorteos", async () => {
  await Give.create({ messageId: "m1", prize: "Nitro", ended: false, messages: { giveaway: "hola", winMessage: { content: "x", embed: true } } });
  await Give.updateOne({ messageId: "m1" }, { messageId: "m1", prize: "Nitro 2", ended: true, winnerIds: ["1", 2] }, { omitUndefined: true }).exec();
  const all = await Give.find().lean().exec();
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0].prize, "Nitro 2");
  assert.deepStrictEqual(all[0].winnerIds, ["1", "2"]);
  assert.deepStrictEqual(all[0].messages.winMessage, { content: "x", embed: true });
  const fresh = await Give.create({ messageId: "m2" });
  assert.strictEqual(fresh.winnerIds, undefined);
  await Give.deleteOne({ messageId: "m2" }).exec();
  assert.strictEqual(await Give.countDocuments(), 1);
});

test(".cache() devuelve copias y se invalida al escribir", async () => {
  await Functions.create({ Guild: "gc", Prefix: "a" });
  const a = await Functions.findOne({ Guild: "gc" }).lean().cache("60 seconds").exec();
  a.Prefix = "modificado";
  const b = await Functions.findOne({ Guild: "gc" }).lean().cache("60 seconds").exec();
  assert.strictEqual(b.Prefix, "a");
  await Functions.updateOne({ Guild: "gc" }, { Prefix: "b" });
  const c = await Functions.findOne({ Guild: "gc" }).lean().cache("60 seconds").exec();
  assert.strictEqual(c.Prefix, "b");
});

test("strict: los campos que no están en el esquema no se guardan", async () => {
  const d = await Functions.create({ Guild: "gs", Prefix: "!", Basura: 1 });
  const r = await odm.db.query(`SELECT doc FROM \`${Functions.table}\` WHERE id = ?`, [d._id]);
  const doc = typeof r[0].doc === "string" ? JSON.parse(r[0].doc) : r[0].doc;
  assert.strictEqual(doc.Basura, undefined);
});
