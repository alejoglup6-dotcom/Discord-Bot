/*
 * Webhook de Tebex. Se arranca una sola vez en el proceso principal (src/index.js), no en cada shard.
 * .env:
 *   TEBEX_WEBHOOK_SECRET  "Secret Key" de creator.tebex.io -> Webhooks (sin ella no se arranca)
 *   TEBEX_PORT            puerto donde escucha (si no, SERVER_PORT del panel del hosting)
 *   TEBEX_LOG_CHANNEL     canal de Discord para el registro de compras (si no, uno que se llame "compras")
 * URL para Tebex: http://IP-del-hosting:PUERTO/tebex
 *
 * Firma (docs.tebex.io, Webhooks): X-Signature = HMAC-SHA256(clave = secret, datos = SHA256(cuerpo) en hex).
 * Solo se aceptan peticiones desde las IPs de Tebex.
 */
const http = require("http");
const crypto = require("crypto");
const tebex = require("../database/tebex");

const TEBEX_IPS = ["18.209.80.3", "54.87.231.232"];
const MAX_BODY = 1024 * 1024;

function sign(rawBody, secret) {
  const bodyHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  return crypto.createHmac("sha256", secret).update(bodyHash).digest("hex");
}

function validSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = Buffer.from(sign(rawBody, secret));
  const got = Buffer.from(String(signature));
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

function clientIp(req) {
  return String(req.socket.remoteAddress || "").replace(/^::ffff:/, "");
}

/**
 * Procesa un evento ya verificado. Devuelve { status, body, log } (log: lo que se avisa en Discord, o null).
 */
async function handleEvent(event) {
  switch (event.type) {
    case "validation.webhook":
      return { status: 200, body: { id: event.id }, log: null };
    case "payment.completed": {
      const r = await tebex.registerPayment(event.subject || {});
      return { status: 200, body: { ok: true }, log: r.status === "duplicate" ? null : { kind: "payment", ...r } };
    }
    case "payment.refunded":
    case "payment.dispute.opened":
    case "payment.dispute.lost":
    case "payment.dispute.won":
    case "payment.dispute.closed": {
      const status = event.type.replace("payment.", "").replace("dispute.", "dispute_").slice(0, 16);
      const r = await tebex.markPayment(event.subject?.transaction_id, status);
      return { status: 200, body: { ok: true }, log: { kind: "problem", type: event.type, transactionId: event.subject?.transaction_id, ...r } };
    }
    default:
      // payment.declined y otros: no hay nada que entregar
      return { status: 200, body: { ok: true }, log: null };
  }
}

function logEmbed(log) {
  const money = (r) => `${r.amount} ${r.currency}`.trim();
  if (log.kind === "payment") {
    const what = [log.coins ? `**${log.coins.toLocaleString("es-ES")}** coins` : null, log.vipDays ? `VIP **${log.vipDays}** días` : null]
      .filter(Boolean)
      .join(" + ");
    const titles = {
      delivered: "🛒・Compra en Tebex entregada",
      no_account: "⚠️・Compra en Tebex SIN ENTREGAR: no existe la cuenta",
      nothing: "⚠️・Compra en Tebex SIN ENTREGAR: paquete no reconocido",
    };
    const fields = [
      { name: "👤┆Cuenta", value: log.player ? `${log.player.name} (DB-ID ${log.player.id})` : `\`${log.username || "(vacío)"}\``, inline: true },
      { name: "💵┆Pagado", value: money(log) || "-", inline: true },
      { name: "🎁┆Entrega", value: what || "Nada", inline: true },
      { name: "📦┆Productos", value: log.products.join("\n").slice(0, 1024) || "-" },
      { name: "🧾┆Transacción", value: `\`${log.transactionId}\`` },
    ];
    if (log.status === "no_account") {
      fields.push({ name: "🛠️┆Qué hacer", value: "El comprador escribió un nombre que no existe en el juego. Hay que entregárselo a mano con el nombre correcto." });
    }
    if (log.unknown.length) {
      fields.push({
        name: "❓┆Paquetes no reconocidos",
        value: `${log.unknown.join(", ")}\nEl nombre del paquete en Tebex debe decir "N Coins" o "VIP N días".`.slice(0, 1024),
      });
    }
    return { title: titles[log.status] || titles.delivered, color: log.status === "delivered" ? 0x3ddc84 : 0xffb020, fields };
  }
  const p = log.payment;
  return {
    title: `🚨・Tebex: ${log.type}`,
    color: 0xff5a5a,
    description: "Reembolso o contracargo. Las coins o el VIP **no se quitan solos**: revisa la cuenta y decide.",
    fields: [
      { name: "🧾┆Transacción", value: `\`${log.transactionId || "?"}\`` },
      ...(p ? [{ name: "👤┆Cuenta", value: `${p.username} (DB-ID ${p.player_id ?? "-"})`, inline: true }, { name: "🎁┆Se entregó", value: `${p.coins} coins, VIP ${p.vip_days} días`, inline: true }] : []),
    ],
  };
}

/**
 * @param {object} o
 * @param {(embed: object) => Promise<void>} [o.notify] envía el registro a Discord
 * @param {boolean} [o.checkIp] solo IPs de Tebex (true por defecto)
 */
function createServer({ secret = process.env.TEBEX_WEBHOOK_SECRET, notify = async () => {}, checkIp = true } = {}) {
  return http.createServer((req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method !== "POST" || !/^\/tebex\/?(\?.*)?$/.test(req.url)) return reply(404, { error: "not found" });
    if (checkIp && !TEBEX_IPS.includes(clientIp(req))) return reply(403, { error: "forbidden" });

    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) req.destroy();
      else chunks.push(c);
    });
    req.on("end", async () => {
      const raw = Buffer.concat(chunks);
      if (!validSignature(raw, req.headers["x-signature"], secret)) return reply(403, { error: "bad signature" });
      let event;
      try {
        event = JSON.parse(raw.toString("utf8"));
      } catch {
        return reply(400, { error: "bad json" });
      }
      try {
        const r = await handleEvent(event);
        reply(r.status, r.body);
        if (r.log) await notify(logEmbed(r.log)).catch((err) => console.log("Tebex (aviso en Discord):", err.message));
      } catch (err) {
        // Un 500 hace que Tebex lo reintente más tarde
        console.log("Tebex:", err.message);
        reply(500, { error: "error" });
      }
    });
  });
}

// Arranque desde src/index.js: el aviso se manda por el shard que tenga el canal
function start(manager) {
  const secret = process.env.TEBEX_WEBHOOK_SECRET;
  const port = parseInt(process.env.TEBEX_PORT || process.env.SERVER_PORT);
  if (!secret || !port) return null;

  const notify = async (embed) => {
    await manager.broadcastEval(
      async (c, { embed, channelId }) => {
        let channel = channelId ? c.channels.cache.get(channelId) : null;
        if (!channel) {
          for (const g of c.guilds.cache.values()) {
            channel = g.channels.cache.find((ch) => ch.isTextBased?.() && /compras|tebex/i.test(ch.name));
            if (channel) break;
          }
        }
        if (channel) await channel.send({ embeds: [{ ...embed, timestamp: new Date().toISOString() }] });
      },
      { context: { embed, channelId: process.env.TEBEX_LOG_CHANNEL || null } },
    );
  };

  tebex
    .init()
    .then(() => {
      const server = createServer({ secret, notify });
      server.listen(port, "0.0.0.0", () => console.log(`Tebex: webhook escuchando en el puerto ${port} (ruta /tebex)`));
      server.on("error", (err) => console.log("Tebex: no se pudo abrir el puerto", port, "-", err.message));
    })
    .catch((err) => console.log("Tebex: no se pudo preparar la base de datos -", err.message));
  return true;
}

module.exports = { start, createServer, handleEvent, sign, validSignature, logEmbed, TEBEX_IPS };
