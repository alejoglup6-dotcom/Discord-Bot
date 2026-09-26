/*
 * Pagos de Tebex (tienda web). El webhook (src/tebex/server.js) llama a registerPayment con cada pago
 * completado: se guarda en tebex_payments (una fila por transacción, así un reintento de Tebex no entrega dos
 * veces) y se dejan acciones "coins" / "vip" en discord_actions para que el gamemode las entregue
 * (gamemodes/src/discord_link.pwn del repo Backup), con el jugador conectado o no.
 *
 * Qué entrega cada paquete se saca de su nombre en Tebex:
 *   "100 Coins", "Pack 250 RoleCoins"  -> 100 / 250 coins
 *   "VIP 30 días", "VIP (60 dias)"    -> VIP por 30 / 60 días (sin número: 30 días)
 * La cantidad comprada multiplica (2 x "100 Coins" = 200 coins).
 */
const db = require("./mysql");

const DEFAULT_VIP_DAYS = 30;

async function init() {
  await db.query(`CREATE TABLE IF NOT EXISTS tebex_payments (
    transaction_id VARCHAR(64) NOT NULL,
    username VARCHAR(64) NOT NULL DEFAULT '',
    player_id INT NULL,
    status VARCHAR(16) NOT NULL,
    coins INT NOT NULL DEFAULT 0,
    vip_days INT NOT NULL DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT '',
    email VARCHAR(128) NOT NULL DEFAULT '',
    products VARCHAR(512) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (transaction_id),
    KEY player (player_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// { coins, vipDays } que da un paquete según su nombre, o null si no se reconoce
function parsePackage(name) {
  const text = String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/\bvip\b/.test(text)) {
    const days = text.match(/(\d+)\s*(dias?|days?|d\b)/);
    return { coins: 0, vipDays: days ? parseInt(days[1]) : DEFAULT_VIP_DAYS };
  }
  const coins = text.match(/(\d[\d.,]*)\s*(role)?\s*coins?\b/);
  if (coins) return { coins: parseInt(coins[1].replace(/[.,]/g, "")), vipDays: 0 };
  return null;
}

// Suma lo que entregan los productos de un pago (payment.completed de Tebex)
function summarize(subject) {
  let coins = 0;
  let vipDays = 0;
  const unknown = [];
  const names = [];
  for (const p of subject.products || []) {
    const qty = Math.max(1, parseInt(p.quantity) || 1);
    names.push(`${qty}x ${p.name}`);
    const pkg = parsePackage(p.name);
    if (!pkg) {
      unknown.push(p.name);
      continue;
    }
    coins += pkg.coins * qty;
    vipDays += pkg.vipDays * qty;
  }
  const username =
    subject.products?.find((p) => p.username?.username)?.username.username || subject.customer?.username?.username || "";
  return { username: username.trim(), coins, vipDays, unknown, names };
}

/**
 * Registra un pago completado y deja la entrega para el gamemode.
 * @returns {{ status: "delivered"|"duplicate"|"no_account"|"nothing", ... }}
 */
async function registerPayment(subject) {
  const txn = String(subject.transaction_id || "");
  if (!txn) throw new Error("Pago sin transaction_id");
  const s = summarize(subject);
  const base = {
    transactionId: txn,
    username: s.username,
    coins: s.coins,
    vipDays: s.vipDays,
    unknown: s.unknown,
    products: s.names,
    amount: subject.price?.amount ?? subject.price_paid?.amount ?? 0,
    currency: subject.price?.currency ?? subject.price_paid?.currency ?? "",
  };

  const conn = await db.getPool().getConnection();
  try {
    await conn.beginTransaction();
    // El nombre de la cuenta en el juego es único; en la tienda el cliente lo escribe a mano
    const [players] = await conn.query("SELECT id, name FROM player WHERE name = ? LIMIT 1", [s.username]);
    const player = players[0] || null;
    const status = !player ? "no_account" : s.coins || s.vipDays ? "delivered" : "nothing";

    const [ins] = await conn.query(
      `INSERT IGNORE INTO tebex_payments (transaction_id, username, player_id, status, coins, vip_days, amount, currency, email, products)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txn,
        s.username.slice(0, 64),
        player?.id ?? null,
        status,
        s.coins,
        s.vipDays,
        Number(base.amount) || 0,
        String(base.currency).slice(0, 8),
        String(subject.customer?.email || "").slice(0, 128),
        s.names.join(", ").slice(0, 512),
      ],
    );
    if (!ins.affectedRows) {
      await conn.rollback();
      return { ...base, status: "duplicate", player };
    }
    if (status === "delivered") {
      const reason = `Tebex ${txn}`.slice(0, 128);
      if (s.coins) {
        await conn.query("INSERT INTO discord_actions (player_id, action, value, reason, by_name) VALUES (?, 'coins', ?, ?, ?)", [
          player.id,
          s.coins,
          reason,
          player.name.slice(0, 24),
        ]);
      }
      if (s.vipDays) {
        await conn.query("INSERT INTO discord_actions (player_id, action, value, reason, by_name) VALUES (?, 'vip', ?, ?, ?)", [
          player.id,
          s.vipDays,
          reason,
          player.name.slice(0, 24),
        ]);
      }
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

// Reembolsos y contracargos: solo se marca el pago (quitar coins ya gastados lo decide el staff)
async function markPayment(transactionId, status) {
  const res = await db.query("UPDATE tebex_payments SET status = ? WHERE transaction_id = ?", [status, String(transactionId)]);
  const rows = await db.query("SELECT * FROM tebex_payments WHERE transaction_id = ?", [String(transactionId)]);
  return { updated: res.affectedRows > 0, payment: rows[0] || null };
}

module.exports = { init, parsePackage, summarize, registerPayment, markPayment, DEFAULT_VIP_DAYS };
