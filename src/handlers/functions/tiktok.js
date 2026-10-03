const Discord = require("discord.js");

const tiktokVideos = require("../../database/models/tiktokVideos");
const tiktokCreators = require("../../database/models/tiktokCreators");
const { textChannel } = require("../../assets/utils/guildLookup");
const { OFFICIAL, fetchProfile, mentionsOfficial } = require("../../assets/utils/tiktok");

/*
 * Canal 🎵┆tiktok (se busca por nombre, "tiktok"). Se revisa cada 10 minutos:
 * - Cuenta oficial (TIKTOK_USER en el .env, por defecto sampcity.oficial): avisa de cada video nuevo. La primera vez en
 *   un servidor solo apunta los videos que ya hay (no los anuncia de golpe).
 * - Creadores de contenido registrados con /tiktok: avisa de sus videos que mencionan a la cuenta oficial
 *   (@sampcity.oficial en la descripción). Al registrarse se publican sus últimas 3 menciones.
 * TikTok no tiene API pública para esto: se lee la página de "incrustar perfil" (src/assets/utils/tiktok.js).
 */
const USER = OFFICIAL;
const INTERVAL = 10 * 60000;
const FIRST_POSTS = 3;

async function fetchVideos() {
  const p = await fetchProfile(USER);
  if (!p.exists) throw new Error(`No se pudo leer el perfil de @${USER}`);
  return p.videos;
}

function creatorAnnouncement(video, creator) {
  const url = `https://www.tiktok.com/@${creator.TikTok}/video/${video.id}`;
  const title = video.desc.replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
  const row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel("Ver en TikTok").setEmoji("🎬").setURL(url),
    new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel(`Seguir a @${creator.TikTok}`).setEmoji("➕").setURL(`https://www.tiktok.com/@${creator.TikTok}`),
  );
  return {
    content: `🎥 **¡Video nuevo de un creador de SampCity!** @${creator.TikTok} (<@${creator.User}>)${title ? `\n> ${title.slice(0, 300)}` : ""}\nApóyalo con un like ❤️ y un comentario 💬.\n${url}`,
    components: [row],
    allowedMentions: { users: [] },
  };
}

// Publica las menciones de un creador que aún no se han avisado en el servidor. max: solo las N más recientes
// (las demás se apuntan como vistas). Devuelve cuántas se publicaron.
async function postCreatorVideos(guild, creator, videos, max = Infinity) {
  const channel = textChannel(guild, /^tiktok$/);
  if (!channel) return 0;
  const seen = new Set((await tiktokVideos.find({ Guild: guild.id }).lean()).map((r) => r.Video));
  const fresh = videos.filter((v) => mentionsOfficial(v.desc, USER) && !seen.has(v.id));
  let posted = 0;
  for (const [i, v] of fresh.entries()) {
    if (i >= fresh.length - max) {
      const ok = await channel.send(creatorAnnouncement(v, creator)).catch((e) => console.log("[tiktok]", e.message));
      if (!ok) continue; // se reintenta en la próxima vuelta
      posted++;
    }
    await new tiktokVideos({ Guild: guild.id, Video: v.id, Date: Date.now() }).save();
  }
  return posted;
}

function announcement(video, rol) {
  const url = `https://www.tiktok.com/@${USER}/video/${video.id}`;
  const title = video.desc.replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
  const row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel("Ver en TikTok").setEmoji("🎬").setURL(url),
    new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel(`Seguir a @${USER}`).setEmoji("➕").setURL(`https://www.tiktok.com/@${USER}`),
  );
  return {
    content: `${rol ? `${rol} · ` : ""}🎬 **¡Nuevo video en nuestro TikTok!**${title ? `\n> ${title.slice(0, 300)}` : ""}\nDale like ❤️, comenta 💬 y compártelo 🔁 para que llegue a más gente.\n${url}`,
    components: [row],
    allowedMentions: { roles: rol ? [rol.id] : [] },
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
            const rol = client.alertRole ? client.alertRole(guild, "tiktok") : null; // alerta 🔔 TikTok (alertas.js)
            const ok = await channel.send(announcement(v, rol)).catch((e) => console.log("[tiktok]", e.message));
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

  let runningCreators = false;
  async function checkCreators() {
    if (runningCreators) return 0;
    runningCreators = true;
    let posted = 0;
    try {
      const all = await tiktokCreators.find({}).lean();
      const byAccount = new Map();
      for (const c of all) byAccount.set(c.TikTok, [...(byAccount.get(c.TikTok) || []), c]);
      for (const [account, list] of byAccount) {
        let profile;
        try {
          profile = await fetchProfile(account);
        } catch (e) {
          console.log("[tiktok]", `@${account}:`, e.message);
          continue;
        }
        for (const c of list) {
          const guild = client.guilds.cache.get(c.Guild);
          if (guild) posted += await postCreatorVideos(guild, c, profile.videos);
        }
        await new Promise((r) => setTimeout(r, 1500)); // sin prisa con TikTok
      }
    } catch (e) {
      console.log("[tiktok]", e.message);
    } finally {
      runningCreators = false;
    }
    return posted;
  }
  client.checkTikTokCreators = checkCreators;
  // /tiktok: al registrarse, publica sus últimas menciones
  client.tiktokCreatorFirstPosts = (guild, creator, videos) => postCreatorVideos(guild, creator, videos, FIRST_POSTS);

  client.once(Discord.Events.ClientReady, () => {
    setTimeout(check, 45000);
    setInterval(check, INTERVAL);
    setTimeout(checkCreators, 90000);
    setInterval(checkCreators, INTERVAL);
  });
};

module.exports.postCreatorVideos = postCreatorVideos;
module.exports.creatorAnnouncement = creatorAnnouncement;
