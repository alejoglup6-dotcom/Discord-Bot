/*
 * Tienda Tebex: el bot pregunta a Tebex por las compras pendientes (Game Server API, la misma que usan los
 * plugins oficiales) y las entrega. No hace falta puerto abierto ni https: la conexión la inicia el bot.
 * Se arranca una sola vez en el proceso principal (src/index.js), no en cada shard.
 * .env:
 *   TEBEX_SECRET        clave secreta del servidor creado en creator.tebex.io -> Game Servers
 *   TEBEX_LOG_CHANNEL   opcional: canal para el registro de compras (si no, uno que se llame "compras" o "tebex")
 *
 * Tebex decide cada cuánto se consulta (meta.next_check): hay que respetarlo o revoca la clave.
 */
const tebex = require("../database/tebex");

const API = "https://plugin.tebex.io";
const MIN_WAIT = 30;
const DEFAULT_WAIT = 120;

function logEmbed(r) {
  const what = r.action === "coins" ? `**${r.value.toLocaleString("es-ES")}** coins` : r.action === "vip" ? `VIP **${r.value}** días` : "-";
  const titles = {
    delivered: "🛒・Compra en Tebex entregada",
    no_account: "⚠️・Compra en Tebex SIN ENTREGAR: no existe la cuenta",
    unknown: "⚠️・Tebex: comando no reconocido",
  };
  const fields = [
    { name: "👤┆Cuenta", value: r.player ? `${r.player.name} (DB-ID ${r.player.id})` : `\`${r.username || "(vacío)"}\``, inline: true },
    { name: "🎁┆Entrega", value: what, inline: true },
    { name: "🧾┆Pago", value: `\`${r.paymentId}\``, inline: true },
    { name: "⌨️┆Comando", value: `\`${r.command.slice(0, 200) || "-"}\`` },
  ];
  if (r.status === "no_account") {
    fields.push({ name: "🛠️┆Qué hacer", value: "El comprador escribió un nombre que no existe en el juego. Hay que entregárselo a mano con el nombre correcto." });
  }
  if (r.status === "unknown") {
    fields.push({ name: "🛠️┆Qué hacer", value: "Los comandos de los paquetes deben ser `coins {username} CANTIDAD` o `vip {username} DÍAS`. Revisa el paquete y entrega a mano." });
  }
  return { title: titles[r.status] || titles.delivered, color: r.status === "delivered" ? 0x3ddc84 : 0xffb020, fields };
}

class TebexQueue {
  /**
   * @param {object} o
   * @param {string} o.secret
   * @param {(embed: object) => Promise<void>} [o.notify]
   * @param {string} [o.api] URL de la API (para pruebas)
   */
  constructor({ secret, notify = async () => {}, api = API }) {
    this.secret = secret;
    this.notify = notify;
    this.api = api;
    this.timer = null;
  }

  async request(method, path, body) {
    const res = await fetch(this.api + path, {
      method,
      headers: { "X-Tebex-Secret": this.secret, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Tebex ${method} ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? null : res.json();
  }

  // Una vuelta: entrega lo pendiente y devuelve cuántos segundos esperar hasta la siguiente
  async poll() {
    const queue = await this.request("GET", "/queue");
    const commands = [];
    // Jugadores con comandos "solo conectado": aquí se entregan igual (el gamemode los aplica al entrar)
    for (const p of queue?.players || []) {
      const online = await this.request("GET", `/queue/online-commands/${p.id}`);
      for (const c of online?.commands || []) commands.push({ ...c, player: c.player || { name: p.name } });
    }
    const offline = await this.request("GET", "/queue/offline-commands");
    commands.push(...(offline?.commands || []));

    const done = [];
    for (const c of commands) {
      const r = await tebex.deliverCommand(c);
      done.push(c.id);
      if (r.status !== "duplicate") await this.notify(logEmbed(r)).catch((err) => console.log("Tebex (aviso en Discord):", err.message));
    }
    // Ya quedaron guardados: si el borrado falla, en la siguiente vuelta llegan como duplicados y no se entregan otra vez
    if (done.length) await this.request("DELETE", "/queue", { ids: done });
    return { delivered: done.length, wait: Math.max(MIN_WAIT, parseInt(queue?.meta?.next_check) || DEFAULT_WAIT) };
  }

  start() {
    const loop = async () => {
      let wait = DEFAULT_WAIT;
      try {
        wait = (await this.poll()).wait;
      } catch (err) {
        console.log("Tebex:", err.message);
      }
      this.timer = setTimeout(loop, wait * 1000);
    };
    tebex
      .init()
      .then(() => {
        console.log("Tebex: revisando compras pendientes");
        // Se espera a que arranquen los shards para poder avisar en Discord
        this.timer = setTimeout(loop, 30000);
      })
      .catch((err) => console.log("Tebex: no se pudo preparar la base de datos -", err.message));
    return this;
  }

  stop() {
    clearTimeout(this.timer);
  }
}

// Arranque desde src/index.js: el aviso se manda por el shard que tenga el canal
function start(manager) {
  const secret = process.env.TEBEX_SECRET;
  if (!secret) return null;
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
  return new TebexQueue({ secret, notify }).start();
}

module.exports = { start, TebexQueue, logEmbed };
