/*
 * Compras de la tienda Tebex. El bot pide a Tebex los comandos pendientes (src/tebex/queue.js), como hacen los
 * plugins oficiales, y los entrega dejando acciones "coins" / "vip" en discord_actions para el gamemode
 * (gamemodes/src/discord_link.pwn del repo Backup), con el jugador conectado o no.
 *
 * Comandos que hay que poner en cada paquete de Tebex:
 *   coins {username} 100   -> 100 coins
 *   vip {username} 30      -> VIP por 30 días (se suman a los que le queden)
 * Cada comando se guarda en tebex_commands con su id de Tebex: si Tebex lo vuelve a mandar, no se entrega dos veces.
 */
const db = require("./mysql");

async function init() {
  await db.query(`CREATE TABLE IF NOT EXISTS tebex_commands (
    command_id BIGINT NOT NULL,
    payment_id BIGINT NOT NULL DEFAULT 0,
    command VARCHAR(255) NOT NULL DEFAULT '',
    username VARCHAR(64) NOT NULL DEFAULT '',
    player_id INT NULL,
    action VARCHAR(16) NOT NULL DEFAULT '',
    value INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (command_id),
    KEY player (player_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// "coins Nombre_Apellido 100" -> { action: "coins", name, value }, o null si no es un comando de la tienda
function parseCommand(text) {
  const m = String(text || "")
    .trim()
    .replace(/^\//, "")
    .match(/^(coins|vip)\s+(\S+)\s+(\d{1,7})$/i);
  if (!m) return null;
  const value = parseInt(m[3]);
  if (!value) return null;
  return { action: m[1].toLowerCase(), name: m[2], value };
}

/**
 * Entrega un comando de la cola de Tebex ({ id, command, payment, player: { name } }).
 * @returns {{ status: "delivered"|"duplicate"|"no_account"|"unknown", ... }}
 */
async function deliverCommand(cmd) {
  const parsed = parseCommand(cmd.command);
  const name = parsed?.name || cmd.player?.name || "";
  const base = { commandId: cmd.id, paymentId: cmd.payment || 0, command: String(cmd.command || ""), username: name, ...(parsed || {}) };

  const conn = await db.getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [players] = parsed ? await conn.query("SELECT id, name FROM player WHERE name = ? LIMIT 1", [name]) : [[]];
    const player = players[0] || null;
    const status = !parsed ? "unknown" : !player ? "no_account" : "delivered";

    const [ins] = await conn.query(
      `INSERT IGNORE INTO tebex_commands (command_id, payment_id, command, username, player_id, action, value, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cmd.id, cmd.payment || 0, base.command.slice(0, 255), name.slice(0, 64), player?.id ?? null, parsed?.action || "", parsed?.value || 0, status],
    );
    if (!ins.affectedRows) {
      await conn.rollback();
      return { ...base, status: "duplicate", player };
    }
    if (status === "delivered") {
      await conn.query("INSERT INTO discord_actions (player_id, action, value, reason, by_name) VALUES (?, ?, ?, ?, ?)", [
        player.id,
        parsed.action,
        parsed.value,
        `Tebex pago ${cmd.payment || "?"} / comando ${cmd.id}`.slice(0, 128),
        player.name.slice(0, 24),
      ]);
    }
    await conn.commit();
    return { ...base, status, player };
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { init, parseCommand, deliverCommand };
