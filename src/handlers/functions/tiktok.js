const Discord = require("discord.js");

const tiktokVideos = require("../../database/models/tiktokVideos");
const { textChannel } = require("../../assets/utils/guildLookup");

/*
 * Avisa en el canal 🎵┆tiktok cada vez que la cuenta de TikTok del servidor sube un video.
 * TikTok no tiene API pública para esto: se lee la página de "incrustar perfil" (https://www.tiktok.com/embed/@usuario),
 * que trae la lista de videos recientes en el JSON __FRONTITY_CONNECT_STATE__. Se revisa cada 10 minutos.
 * La primera vez en un servidor solo apunta los videos que ya hay (no los anuncia de golpe).
 * Cuenta: TIKTOK_USER en el .env (por defecto sampcity.oficial). El canal se busca por nombre ("tiktok").
 */
const USER = (process.env.TIKTOK_USER || "sampcity.oficial").replace(/^@/, "");
const INTERVAL = 10 * 60000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function fetchVideos() {
  const res = await fetch(`https://www.tiktok.com/embed/@${USER}`, { headers: { "User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9" } });
  if (!res.ok) throw new Error(`TikTok respondió ${res.status}`);
  const html = await res.text();
  const m = html.match(/<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("TikTok cambió la página de incrustar perfil");
  let list = null;
  (function walk(o) {
    if (list || !o || typeof o !== "object") return;
    if (Array.isArray(o.videoList)) list = o.videoList;
    else for (const v of Object.values(o)) walk(v);
  })(JSON.parse(m[1]));
  if (!list) throw new Error("No hay lista de videos en la página de TikTok");
  // más antiguos primero (los ids de TikTok crecen con el tiempo)
  return list
    .filter((v) => v && /^\d+$/.test(String(v.id)))
    .map((v) => ({ id: String(v.id), desc: String(v.desc || "") }))
    .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
}

function announcement(video) {
  const url = `https://www.tiktok.com/@${USER}/video/${video.id}`;
  const title = video.desc.replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
  const row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel("Ver en TikTok").setEmoji("🎬").setURL(url),
    new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel(`Seguir a @${USER}`).setEmoji("➕").setURL(`https://www.tiktok.com/@${USER}`),
  );
  return {
    content: `🎬 **¡Nuevo video en nuestro TikTok!**${title ? `\n> ${title.slice(0, 300)}` : ""}\nDale like ❤️, comenta 💬 y compártelo 🔁 para que llegue a más gente.\n${url}`,
    components: [row],
  };
}

module.exports = (client) => {
  let running = false;

  // Devuelve cuántos videos se anunciaron (lo puede usar una prueba a mano)
  async function check() {
    if (running) return 0;
    running = true;
    let posted = 0;
    try {
      const videos = await fetchVideos();
      for (const guild of client.guilds.cache.values()) {
        const channel = textChannel(guild, /^tiktok$/);
        if (!channel) continue;
        const seen = new Set((await tiktokVideos.find({ Guild: guild.id }).lean()).map((r) => r.Video));
        // la primera vez en el servidor solo se apuntan los que ya hay (marca "inicio")
        const first = !seen.has("inicio");
        if (first) await new tiktokVideos({ Guild: guild.id, Video: "inicio", Date: Date.now() }).save();
        for (const v of videos) {
          if (seen.has(v.id)) continue;
          if (!first) {
            const ok = await channel.send(announcement(v)).catch((e) => console.log("[tiktok]", e.message));
            if (!ok) continue; // se reintenta en la próxima vuelta
            posted++;
          }
          await new tiktokVideos({ Guild: guild.id, Video: v.id, Date: Date.now() }).save();
        }
      }
    } catch (e) {
      console.log("[tiktok]", e.message);
    } finally {
      running = false;
    }
    return posted;
  }
  client.checkTikTok = check;

  client.once(Discord.Events.ClientReady, () => {
    setTimeout(check, 45000);
    setInterval(check, INTERVAL);
  });
};
