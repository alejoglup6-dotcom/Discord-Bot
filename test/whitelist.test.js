/*
 * Whitelist del servidor contra la base de datos local (mismas tablas que gamemodes/src/whitelist.pwn).
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const db = require("../src/database/mysql");
const wl = require("../src/database/whitelist");

const TAG = "Wt" + Date.now().toString(36).slice(-6);
const A = `${TAG}_Uno`, B = `${TAG}_Dos`;
let before;

test.before(async () => {
  await wl.init();
  before = await wl.getConfig();
});

test.after(async () => {
  await db.query("DELETE FROM whitelist WHERE name LIKE ?", [TAG + "%"]);
  await wl.setEnabled(before.enabled, before.updatedBy);
  await wl.setMessage(before.message, before.updatedBy);
  await db.close();
});

test("separa los nombres válidos de los que no lo son", () => {
  const r = wl.parseNames(`${A}, ${B}  ${A} ñandú_x ab Nombre_Con_Mas_De_Veinticuatro_Letras [SC]Luis.Diaz`);
  assert.deepStrictEqual(r.valid, [A, B, "[SC]Luis.Diaz"]);
  assert.deepStrictEqual(r.invalid, ["ñandú_x", "ab", "Nombre_Con_Mas_De_Veinticuatro_Letras"]);
});

test("agregar, sin duplicar y sin distinguir mayúsculas", async () => {
  let r = await wl.add([A, B], "Tester");
  assert.deepStrictEqual(r, { added: [A, B], already: [] });
  r = await wl.add([A.toLowerCase()], "Tester");
  assert.deepStrictEqual(r.already, [A.toLowerCase()]);
  assert.ok(await wl.has(B.toUpperCase()));
  const names = (await wl.list()).map((x) => x.name);
  assert.ok(names.includes(A) && names.includes(B));
});

test("quitar", async () => {
  assert.strictEqual(await wl.remove(B.toLowerCase()), true);
  assert.strictEqual(await wl.remove(B), false);
  assert.ok(!(await wl.has(B)));
});

test("activar, desactivar y mensaje (lo que lee el gamemode al conectarse)", async () => {
  await wl.setEnabled(true, "Admin_Test");
  await wl.setMessage("Solo beta testers|Postulate en Discord", "Admin_Test");
  const c = await wl.getConfig();
  assert.strictEqual(c.enabled, true);
  assert.strictEqual(c.message, "Solo beta testers|Postulate en Discord");
  assert.ok(c.total >= 1);

  // La misma consulta que hace el gamemode (Whitelist_FormatCheck)
  const check = (name) =>
    db.query(
      `SELECT c.enabled, EXISTS(SELECT 1 FROM whitelist w WHERE w.name = ?) AS listed,
       EXISTS(SELECT 1 FROM player p WHERE p.name = ? AND p.admin_level > 0) AS staff
       FROM whitelist_config c WHERE c.id = 1`,
      [name, name],
    );
  let [row] = await check(A.toUpperCase());
  assert.deepStrictEqual([Number(row.enabled), Number(row.listed)], [1, 1]);
  [row] = await check(`${TAG}_Nadie`);
  assert.deepStrictEqual([Number(row.listed), Number(row.staff)], [0, 0]);
  const [admin] = await db.query("SELECT name FROM player WHERE admin_level > 0 LIMIT 1");
  if (admin) {
    [row] = await check(admin.name);
    assert.strictEqual(Number(row.staff), 1, "el staff entra aunque no esté en la lista");
  }

  await wl.setEnabled(false, "Admin_Test");
  assert.strictEqual((await wl.getConfig()).enabled, false);
});
