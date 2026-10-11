const Discord = require("discord.js");
const db = require("../../database/mysql");
const samp = require("../../database/samp");
const { COLORS, brandEmbed } = require("../../assets/utils/brand");
const { textChannel } = require("../../assets/utils/guildLookup");

/*
 * Códigos del stream de TikTok (12-oct-2026). En el juego, Lelo_Drok usa /codigo stream y el código sale en la pantalla
 * de todos; el primero que escribe /reclamar codigo [CÓDIGO] gana $10.000 (gamemodes/src/stream_codigo.pwn del repo
 * Backup, tabla stream_codes). Aquí, cada 10 segundos, se anuncia en Discord quién lo reclamó y se marca announced = 1.
 *
 * .env (opcional):
 *   STREAM_CODES = off        desactiva los anuncios
 *   STREAM_CODES_CANAL        ID del canal (si no, el que se llame "tiktok")
 */
const CADA = 10000;
const RE_CANAL = /^tiktok$/;

function canal(guild) {
  const id = process.env.STREAM_CODES_CANAL;
  if (id && guild.channels.cache.has(id)) return guild.channels.cache.get(id);
  return textChannel(guild, RE_CANAL);
}

function anuncio(guild, row) {
  const premio = Number(row.prize || 0).toLocaleString("es-ES");
  return brandEmbed(guild, {
    title: "CÓDIGO DEL STREAM RECLAMADO",
    color: COLORS.red,
    desc:
      `🎁 **${row.claimed_by_name}** reclamó el código **\`${row.code}\`** viendo el stream en **TikTok** y ganó **$${premio}** en el juego.\n\n` +
      "📺 Mira los directos de **@sampcity.oficial** en TikTok: en cualquier momento sale un código nuevo en la pantalla del servidor.",
  });
}

/** Anuncia los códigos reclamados que faltan. Devuelve cuántos se anunciaron. */
async function revisar(client) {
  if (!(await samp.isAvailable())) return 0;
  let rows;
  try {
    rows = await db.query(
      "SELECT id, code, claimed_by_name, prize FROM stream_codes WHERE claimed_at IS NOT NULL AND announced = 0 ORDER BY id LIMIT 10",
    );
  } catch (e) {
    if (e.code === "ER_NO_SUCH_TABLE") return 0; // el gamemode aún no la creó
    throw e;
  }
  let n = 0;
  for (const row of rows) {
    // se marca primero: si Discord falla, no se repite el anuncio en cada vuelta
    const r = await db.query("UPDATE stream_codes SET announced = 1 WHERE id = ? AND announced = 0", [row.id]);
    if (!r.affectedRows) continue;
    for (const guild of client.guilds.cache.values()) {
      const ch = canal(guild);
      if (!ch) continue;
      await ch.send({ embeds: [anuncio(guild, row)] }).catch((e) => console.log("[stream] no pude anunciar:", e.message));
    }
    n++;
  }
  return n;
}

module.exports = (client) => {
  if (String(process.env.STREAM_CODES || "").toLowerCase() === "off") return;
  let ocupado = false;
  const vuelta = async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      const n = await revisar(client);
      if (n) console.log(`[stream] ${n} código(s) del stream anunciados`);
    } catch (e) {
      console.log("[stream]", e.message);
    } finally {
      ocupado = false;
    }
  };
  client.once(Discord.Events.ClientReady, () => setInterval(vuelta, CADA).unref?.());
};

module.exports.revisar = revisar;
module.exports.anuncio = anuncio;
