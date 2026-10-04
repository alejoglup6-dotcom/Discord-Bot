/*
 * Pruebas de los rangos unificados juego <-> Discord (src/database/rangos.js).
 * Las de cálculo no necesitan base de datos; la última usa la copia de la base del servidor (s107_Samp.sql cargado)
 * y deja todo como estaba.
 */
require("dotenv").config({ quiet: true });
const test = require("node:test");
const assert = require("node:assert");
const data = require("../src/assets/data/rangos");
const rangos = require("../src/database/rangos");

const role = (k) => data.BY_KEY.get(k).role;
const base = { admin_level: 0, level: 1, vip: 0, vip_expire_date: null, bank_account: 0, bank_money: 0, crew: null, crew_rank: 0 };

test("cada rango tiene un rol distinto y las claves de facción existen", () => {
  const roles = data.RANKS.map((r) => r.role);
  assert.strictEqual(new Set(roles).size, roles.length);
  for (const f of Object.values(data.FACTIONS)) assert.ok(data.BY_KEY.has(`${f}_1`), f);
});

test("rangos automáticos: staff, facción, banda, nivel, economía y logros", () => {
  const k = rangos.computeAuto({ ...base, admin_level: 4, level: 22, crew: 5, crew_rank: 0, bank_account: 1, bank_money: 1500000 }, { id_faction: 1, level: 12 }, new Set([19, 2]), 1);
  assert.deepStrictEqual(
    [...k].sort(),
    ["banda_lider", "eco_empresario", "eco_millonario", "logro_placa", "nivel_11", "sapd_12", "staff_modglobal"].sort(),
  );
  // sin cuenta bancaria no es millonario; banda con rango > 0 es miembro; nivel 1 = Arena
  const k2 = rangos.computeAuto({ ...base, crew: 5, crew_rank: 2, bank_money: 5000000 }, { id_faction: 3, level: 1 });
  assert.deepStrictEqual([...k2].sort(), ["banda_miembro", "nivel_1", "saem_1"].sort());
  // rango por encima del máximo -> el más alto de la facción
  assert.ok(rangos.computeAuto(base, { id_faction: 2, level: 20 }).has("fbi_8"));
});

test("staff 1-9 y facciones nuevas (LSSD, Gobierno, CITYTV)", () => {
  assert.ok(rangos.computeAuto({ ...base, admin_level: 1 }).has("staff_soporte"));
  assert.ok(rangos.computeAuto({ ...base, admin_level: 6 }).has("staff_encargado"));
  assert.ok(rangos.computeAuto({ ...base, admin_level: 9 }).has("staff_fundador"));
  assert.ok(rangos.computeAuto(base, { id_faction: 4, level: 9 }).has("lssd_9"));
  assert.ok(rangos.computeAuto(base, { id_faction: 5, level: 2 }).has("gob_2"));
  assert.ok(rangos.computeAuto(base, { id_faction: 6, level: 1 }).has("citytv_1"));
  assert.ok(!data.RANKS.some((r) => r.mode === "pending"));
});

test("VIP y Socio, con vencimiento", () => {
  assert.deepStrictEqual(rangos.vipState({ vip: 2, vip_expire_date: "2999-01-01 00:00:00" }), { vip: true, socio: false });
  assert.deepStrictEqual(rangos.vipState({ vip: 3, vip_expire_date: "2999-01-01 00:00:00" }), { vip: true, socio: true });
  assert.deepStrictEqual(rangos.vipState({ vip: 2, vip_expire_date: "2000-01-01 00:00:00" }), { vip: false, socio: false });
  assert.deepStrictEqual(rangos.vipState({ vip: 0 }), { vip: false, socio: false });
});

test("escalones de invitados", () => {
  assert.strictEqual(rangos.refTier(2), null);
  assert.strictEqual(rangos.refTier(3), "ref_reclutador");
  assert.strictEqual(rangos.refTier(26), "ref_oro");
  assert.strictEqual(rangos.refTier(500), "ref_leyenda");
});

test("plan: pone lo del juego, quita lo que ya no tiene y no toca lo pendiente ni lo ajeno", () => {
  const state = { auto: new Set(["sapd_7", "nivel_3", "staff_moderador"]), vip: true, socio: false, manual: new Map(), gameRefs: 0 };
  const member = new Set([role("staff_admin"), role("fbi_2"), data.BY_KEY.get("fbi_2").group, role("staff_fundador"), "2026", "🔔 Anuncios", role("lssd_9")]);
  const p = rangos.plan(member, state, 0);
  for (const n of [role("sapd_7"), data.BY_KEY.get("sapd_7").group, role("nivel_3"), role("staff_moderador"), data.VIP_ROLE, data.LINKED_ROLE]) assert.ok(p.add.includes(n), n);
  // el juego manda: lo que no tiene en el juego se quita (también Fundador y Sheriff, que ya existen en el juego)
  for (const n of [role("staff_admin"), role("fbi_2"), data.BY_KEY.get("fbi_2").group, role("staff_fundador"), role("lssd_9")]) assert.ok(p.remove.includes(n), n);
  // año y avisos: no se tocan
  for (const n of ["2026", "🔔 Anuncios"]) assert.ok(!p.remove.includes(n), n);
  assert.ok(!p.add.includes(data.SOCIO_ROLE));
});

test("plan: rangos manuales en los dos sentidos y escalón de invitados", () => {
  const state = { auto: new Set(), vip: false, socio: false, manual: new Map([["creador_youtuber", "game"], ["insignia_artista", "discord"]]), gameRefs: 2 };
  const member = new Set([role("creador_tiktoker"), data.LINKED_ROLE]);
  const p = rangos.plan(member, state, 3); // 2 referidos del juego + 3 invitaciones = 5 -> Embajador Bronce
  assert.deepStrictEqual(p.saveManual, ["creador_tiktoker"]); // dado en Discord -> al juego
  assert.ok(p.add.includes(role("creador_youtuber"))); // dado en el juego -> a Discord
  assert.deepStrictEqual(p.deleteManual, ["insignia_artista"]); // quitado en Discord -> se quita del juego
  assert.strictEqual(p.refKey, "ref_bronce");
  assert.ok(p.add.includes(role("ref_bronce")));
  assert.ok(!p.add.includes(data.LINKED_ROLE)); // ya lo tenía
});

test("plan: sanciones, plataforma, país y rol de banda", () => {
  const sr = data.SANCTION_ROLES;
  const crews = new Map([[5, "🏴 Los Verdes"], [6, "🏴 Otra"]]);
  const state = { auto: new Set(), vip: false, socio: false, manual: new Map(), gameRefs: 0, muted: true, oocJail: false, warnings: 5, platform: "android", country: "Mexico", crewId: 5 };
  const member = new Set([sr.oocJail, sr.warnings[0], data.PLATFORM_ROLES.pc, "🇦🇷 Argentina", "🏴 Otra", "🇭🇹 Haití"]);
  const p = rangos.plan(member, state, 0, crews);
  for (const n of [sr.muted, sr.warnings[2], data.PLATFORM_ROLES.android, "🇲🇽 México", "🏴 Los Verdes"]) assert.ok(p.add.includes(n), n);
  for (const n of [sr.oocJail, sr.warnings[0], data.PLATFORM_ROLES.pc, "🇦🇷 Argentina", "🏴 Otra"]) assert.ok(p.remove.includes(n), n);
  assert.ok(!p.remove.includes("🇭🇹 Haití")); // no está en el juego: no se toca
  // sin plataforma ni país en el juego: se queda lo que eligió en Discord
  const q = rangos.plan(new Set([data.PLATFORM_ROLES.pc, "🇦🇷 Argentina"]), { ...state, platform: null, country: null, crewId: null, muted: false, warnings: 0 }, 0, crews);
  assert.ok(!q.remove.includes(data.PLATFORM_ROLES.pc) && !q.remove.includes("🇦🇷 Argentina"));
  assert.ok(!q.add.some((n) => n.startsWith("🏴 ")));
});

test("los países del juego tienen rol", () => {
  // CC_COUNTRIES de gamemodes/src/char_creator.pwn
  const game = ["Colombia", "Argentina", "Mexico", "Venezuela", "Peru", "Chile", "Ecuador", "Uruguay", "Paraguay", "Bolivia", "Espana", "Estados Unidos", "Republica Dominicana", "Cuba", "Puerto Rico", "Guatemala", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama", "Brasil", "Otro"];
  for (const c of game) assert.ok(data.COUNTRY_ROLES[c], c);
  assert.strictEqual(new Set(Object.values(data.COUNTRY_ROLES)).size, game.length);
});

test.after(() => require("../src/database/mysql").close());

test("linkedStates contra la base de datos de prueba", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const db = require("../src/database/mysql");
  await rangos.init();
  const [p] = await db.query("SELECT id FROM player ORDER BY id LIMIT 1");
  const DISCORD = "900000000000000777";
  const before = await db.query("SELECT * FROM discord_links WHERE player_id = ?", [p.id]);
  try {
    await db.query("DELETE FROM discord_links WHERE player_id = ?", [p.id]);
    await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [p.id, DISCORD]);
    await db.query("INSERT IGNORE INTO player_ranks (player_id, rank_key, source) VALUES (?, 'insignia_artista', 'game')", [p.id]);
    const st = (await rangos.linkedStates()).find((s) => s.playerId === Number(p.id));
    assert.ok(st, "la cuenta vinculada aparece");
    assert.strictEqual(st.discordId, DISCORD);
    assert.strictEqual(st.manual.get("insignia_artista"), "game");
    assert.ok([...st.auto].some((k) => k.startsWith("nivel_")), "tiene título de nivel");
  } finally {
    await db.query("DELETE FROM player_ranks WHERE player_id = ? AND rank_key = 'insignia_artista' AND source = 'game'", [p.id]);
    await db.query("DELETE FROM discord_links WHERE player_id = ?", [p.id]);
    for (const r of before) await db.query("INSERT INTO discord_links (player_id, discord_id, linked_at) VALUES (?, ?, ?)", [r.player_id, r.discord_id, r.linked_at]);
  }
});

test("Socio: deja la acción para el gamemode", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const db = require("../src/database/mysql");
  const [p] = await db.query("SELECT id, name FROM player ORDER BY id LIMIT 1");
  await samp.grantSocio(p, 365, { name: "Prueba_Staff" });
  const [row] = await db.query("SELECT * FROM discord_actions WHERE player_id = ? AND action = 'socio' ORDER BY id DESC LIMIT 1", [p.id]);
  try {
    assert.ok(row, "hay acción");
    assert.strictEqual(Number(row.value), 365);
    assert.strictEqual(row.by_name, p.name);
    assert.strictEqual(Number(row.done), 0);
  } finally {
    if (row) await db.query("DELETE FROM discord_actions WHERE id = ?", [row.id]);
  }
});

test("sanciones, plataforma, país y banda contra la base de datos de prueba", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const db = require("../src/database/mysql");
  await rangos.init();
  const [p] = await db.query("SELECT id, name, mute, crew FROM player ORDER BY id LIMIT 1");
  const DISCORD = "900000000000000778";
  const before = await db.query("SELECT * FROM discord_links WHERE player_id = ?", [p.id]);
  const hadStatus = await db.query("SELECT * FROM player_status WHERE player_id = ?", [p.id]);
  const hadChar = await db.query("SELECT country FROM pcharacter WHERE id_player = ?", [p.id]);
  try {
    await db.query("DELETE FROM discord_links WHERE player_id = ?", [p.id]);
    await db.query("INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [p.id, DISCORD]);
    await db.query("UPDATE player SET mute = UNIX_TIMESTAMP() + 600 WHERE id = ?", [p.id]);
    await db.query("REPLACE INTO player_status (player_id, platform, ooc_jail) VALUES (?, 'android', 1)", [p.id]);
    if (hadChar.length) await db.query("UPDATE pcharacter SET country = 'Peru' WHERE id_player = ?", [p.id]);
    else await db.query("INSERT INTO pcharacter (id_player, country) VALUES (?, 'Peru')", [p.id]);
    const n1 = await samp.warn(p, { id: 0, name: "Prueba_Staff" }, "prueba");
    const n2 = await samp.warn(p, { id: 0, name: "Prueba_Staff" }, "prueba");
    assert.strictEqual(n2, n1 + 1);
    const st = (await rangos.linkedStates()).find((s) => s.playerId === Number(p.id));
    assert.strictEqual(st.muted, true);
    assert.strictEqual(st.oocJail, true);
    assert.strictEqual(st.platform, "android");
    assert.strictEqual(st.country, "Peru");
    assert.strictEqual(st.warnings, n2);
    assert.strictEqual(await samp.unwarn(p), n2 - 1);
    assert.strictEqual(await samp.unwarn(p), n2 - 2);
    const crews = await rangos.crews();
    if (crews.length) assert.ok(crews[0].name.startsWith(data.CREW_ROLE_PREFIX) && /^#[0-9a-f]{6}$/.test(crews[0].color));
  } finally {
    await db.query("DELETE FROM discord_actions WHERE player_id = ? AND action = 'warn' AND by_name = 'Prueba_Staff'", [p.id]);
    await db.query("UPDATE player SET mute = ? WHERE id = ?", [p.mute, p.id]);
    await db.query("DELETE FROM player_status WHERE player_id = ?", [p.id]);
    for (const r of hadStatus) await db.query("INSERT INTO player_status (player_id, platform, ooc_jail) VALUES (?, ?, ?)", [r.player_id, r.platform, r.ooc_jail]);
    if (hadChar.length) await db.query("UPDATE pcharacter SET country = ? WHERE id_player = ?", [hadChar[0].country, p.id]);
    else await db.query("DELETE FROM pcharacter WHERE id_player = ?", [p.id]);
    await db.query("DELETE FROM discord_links WHERE player_id = ?", [p.id]);
    for (const r of before) await db.query("INSERT INTO discord_links (player_id, discord_id, linked_at) VALUES (?, ?, ?)", [r.player_id, r.discord_id, r.linked_at]);
  }
});

test("insignias automáticas: Donador, Diamante y Beta tester", async (t) => {
  const samp = require("../src/database/samp");
  if (!(await samp.isAvailable())) return t.skip("sin base de datos del servidor");
  const db = require("../src/database/mysql");
  await rangos.init();
  // la tienda Tebex se quitó (03-oct-2026); la tabla puede quedar de compras viejas: se crea aquí para la prueba
  await db.query(`CREATE TABLE IF NOT EXISTS tebex_commands (command_id BIGINT NOT NULL, payment_id BIGINT NOT NULL DEFAULT 0,
    command VARCHAR(255) NOT NULL DEFAULT '', username VARCHAR(64) NOT NULL DEFAULT '', player_id INT NULL, action VARCHAR(16) NOT NULL DEFAULT '',
    value INT NOT NULL DEFAULT 0, status VARCHAR(16) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (command_id))`);
  const [p] = await db.query("SELECT id, DATE(reg_date) AS d FROM player WHERE reg_date > '2000-01-01' ORDER BY id LIMIT 1");
  const keys = ["insignia_donador", "insignia_diamante", "insignia_betatester"];
  const had = await db.query("SELECT rank_key FROM player_ranks WHERE player_id = ? AND rank_key IN (?)", [p.id, keys]);
  const ids = [990000001, 990000002];
  try {
    await db.query("DELETE FROM player_ranks WHERE player_id = ? AND rank_key IN (?)", [p.id, keys]);
    await db.query("INSERT INTO tebex_commands (command_id, player_id, action, value, status) VALUES (?, ?, 'coins', 60, 'delivered'), (?, ?, 'coins', 50, 'delivered')", [ids[0], p.id, ids[1], p.id]);
    const day = new Date(p.d).toISOString().slice(0, 10);
    await rangos.autoBadges({ RANGOS_BETA_DESDE: day, RANGOS_BETA_HASTA: day });
    const got = (await db.query("SELECT rank_key, source FROM player_ranks WHERE player_id = ? AND rank_key IN (?)", [p.id, keys])).map((r) => r.rank_key);
    for (const k of keys) assert.ok(got.includes(k), k);
    // con más coins de las compradas no es Diamante
    await db.query("DELETE FROM player_ranks WHERE player_id = ? AND rank_key IN (?)", [p.id, keys]);
    await rangos.autoBadges({ RANGOS_DIAMANTE_COINS: "500" });
    const got2 = (await db.query("SELECT rank_key FROM player_ranks WHERE player_id = ? AND rank_key IN (?)", [p.id, keys])).map((r) => r.rank_key);
    assert.deepStrictEqual(got2, ["insignia_donador"]);
  } finally {
    await db.query("DELETE FROM tebex_commands WHERE command_id IN (?)", [ids]);
    await db.query("DELETE FROM player_ranks WHERE player_id = ? AND rank_key IN (?) AND source = 'game'", [p.id, keys]);
    for (const r of had) await db.query("INSERT IGNORE INTO player_ranks (player_id, rank_key, source) VALUES (?, ?, 'game')", [p.id, r.rank_key]);
  }
});
