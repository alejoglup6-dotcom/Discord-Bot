const Discord = require("discord.js");

const tiktokVideos = require("../../database/models/tiktokVideos");
const tiktokCreators = require("../../database/models/tiktokCreators");
const { textChannel } = require("../../assets/utils/guildLookup");

/*
 * Avisa en el canal 🎵┆tiktok de los videos de TikTok.
 * TikTok no tiene API pública para esto: se lee la página de "incrustar perfil" (https://www.tiktok.com/embed/@usuario),
 * que trae la lista de videos recientes en el JSON __FRONTITY_CONNECT_STATE__. Se revisa cada 10 minutos.
 * El canal se busca por nombre ("tiktok"). Cada video publicado se guarda en la base de datos (tiktokVideos, por servidor);
 * todo video que no esté guardado se publica, sin importar cuántos sean (con 1 segundo entre mensajes). Si el envío falla,
 * no se guarda y se reintenta en la próxima vuelta.
 *
 * 1) CUENTA DEL SERVIDOR: TIKTOK_USER en el .env (por defecto sampcity.oficial). Se avisan TODOS sus videos nuevos.
 * 2) CREADORES: videos de OTRAS cuentas, pero solo si el video menciona a @TIKTOK_USER. La lista de creadores se maneja
 *    con el comando /tiktok add | remove | list (se guarda en la base de datos y se lee al instante, sin reiniciar).
 *    También se pueden dejar fijos en el .env con TIKTOK_CREATORS=creador1,creador2.
 *
 * Los avisos mencionan el rol de notificaciones de TikTok (TIKTOK_ROLE_ID) y llevan la miniatura del video.
 *
 * Cómo se sabe que un video menciona a la cuenta: en la descripción TikTok escribe el NOMBRE para mostrar de la cuenta
 * etiquetada ("@SampCity | FaseBeta"), no su usuario. Por eso, si la descripción tiene una "@", se abre la página del
 * video, que trae los usuarios etiquetados de verdad (textExtra): así no cuenta un "@SampCity" de otra cuenta ni se
 * pierde una mención si la cuenta cambia de nombre. Si TikTok no deja abrir la página, se mira el texto (usuario o
 * nombre para mostrar actual de la cuenta).
 *
 * Opcionales en el .env:
 *   TIKTOK_ROLE_ID=<id del rol>         rol a mencionar en los avisos (por defecto el de notificaciones de TikTok)
 *   TIKTOK_MENTION_NAMES=SampCity       nombres para mostrar antiguos de la cuenta (el actual, ej. "SampCity | FaseBeta",
 *                                       se lee solo del perfil). TikTok escribe ese nombre en la descripción al etiquetar.
 *   TIKTOK_CREATORS=creador1,creador2   creadores fijos (además de los del comando)
 *   TIKTOK_MENTIONS=0                   apaga el aviso de menciones de creadores (por defecto activo)
 *   TIKTOK_MENTIONS_MINUTES             cada cuánto revisar creadores (por defecto 10)
 *   TIKTOK_MENTIONS_PING=0              no mencionar el rol en los avisos de creadores (por defecto sí)
 *   TIKTOK_DEBUG=1                      imprime cada video leído de los creadores (para diagnosticar)
 */
const USER = (process.env.TIKTOK_USER || "sampcity.oficial").replace(/^@/, "");
const INTERVAL = 10 * 60000;
// Rol de notificaciones de TikTok (si no existe en el servidor se usa el rol "🔔 TikTok" de alertas.js)
const ROLE_ID = (process.env.TIKTOK_ROLE_ID || "1554482987482095676").trim();
// Nombres para mostrar de la cuenta tal como salen en las descripciones al etiquetarla (TIKTOK_MENTION_NAMES=SampCity,otro)
const MENTION_NAMES = (process.env.TIKTOK_MENTION_NAMES || "").split(",").map((n) => n.trim().replace(/^@/, "")).filter(Boolean);
const DEBUG = process.env.TIKTOK_DEBUG === "1";

const MENTIONS_ON = process.env.TIKTOK_MENTIONS !== "0";
const MENTIONS_INTERVAL = (Number(process.env.TIKTOK_MENTIONS_MINUTES) || 10) * 60000;
const MENTIONS_PING = process.env.TIKTOK_MENTIONS_PING !== "0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const TIKTOK_COLOR = 0xfe2c55;

// "@Usuario", "usuario" o un link de TikTok -> "usuario" en minúsculas (o null si no es un usuario válido)
function normalizeCreator(input) {
  let t = String(input || "").trim();
  const link = t.match(/tiktok\.com\/@([\w.]+)/i);
  if (link) t = link[1];
  t = t.replace(/^@/, "").replace(/\/+$/, "").toLowerCase();
  return /^[\w.]{2,24}$/.test(t) ? t : null;
}

// Creadores fijos del .env
const ENV_CREATORS = [...new Set((process.env.TIKTOK_CREATORS || "").split(/[,\s]+/).map(normalizeCreator).filter(Boolean))].filter((c) => c !== USER.toLowerCase());

// Usuarios etiquetados en un video. Ojo: en la descripción TikTok escribe el NOMBRE para mostrar de la cuenta etiquetada
// (ej. "@SampCity | FaseBeta"), no su usuario (@sampcity.oficial); el usuario real viene en textExtra.
function videoTags(v) {
  const tags = new Set();
  for (const t of [].concat(v.textExtra || v.text_extra || [], v.mentions || [])) {
    if (typeof t === "string") tags.add(t.replace(/^@/, "").toLowerCase());
    else if (t && typeof t === "object") {
      for (const k of ["userUniqueId", "user_unique_id", "uniqueId", "unique_id", "userName", "username"]) {
        if (t[k]) tags.add(String(t[k]).replace(/^@/, "").toLowerCase());
      }
    }
  }
  return [...tags];
}

// Dirección de la portada que venga en los datos del video (puede no haber)
function coverOf(v) {
  const first = (x) => (Array.isArray(x) ? x.find((s) => typeof s === "string" && /^https?:/.test(s)) : typeof x === "string" && /^https?:/.test(x) ? x : null);
  const direct = [v.cover, v.originCover, v.dynamicCover, v.thumbnail, v.video?.cover, v.video?.originCover, v.video?.dynamicCover, v.imagePost?.cover?.imageURL?.urlList, v.imagePost?.images?.[0]?.imageURL?.urlList];
  for (const c of direct) {
    const u = first(c);
    if (u) return u;
  }
  let found = null;
  (function walk(o, depth, key) {
    if (found || !o || depth > 4) return;
    if (typeof o === "string") {
      if (/cover|thumb/i.test(key) && /^https?:/.test(o)) found = o;
      return;
    }
    if (typeof o === "object") for (const [k, val] of Object.entries(o)) walk(val, depth + 1, k);
  })(v, 0, "");
  return found;
}

// Perfil: { info: {uniqueId, nickname, privateAccount...}, videos: [...] }. Lanza un error con el motivo si no se puede leer.
async function fetchProfile(user = USER) {
  const res = await fetch(`https://www.tiktok.com/embed/@${user}`, { headers: { "User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9" }, signal: AbortSignal.timeout(30000) });
  if (res.status === 429 || res.status >= 500) throw new Error(`TikTok respondió ${res.status}, se reintenta luego`);
  const html = await res.text();
  const m = html.match(/<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error(res.ok ? "TikTok cambió la página de incrustar perfil" : `TikTok respondió ${res.status}`);
  let list = null;
  let info = null;
  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (!list && Array.isArray(o.videoList)) list = o.videoList;
    if (!info && o.userInfo && typeof o.userInfo === "object") info = o.userInfo;
    for (const v of Object.values(o)) walk(v);
  })(JSON.parse(m[1]));
  if (!list) {
    if (info && info.privateAccount) throw new Error("la cuenta es privada");
    if (!res.ok || !info || !info.nickname) throw new Error("la cuenta no existe");
    list = []; // cuenta pública sin videos todavía
  }
  // más antiguos primero (los ids de TikTok crecen con el tiempo)
  const videos = list
    .filter((v) => v && /^\d+$/.test(String(v.id)))
    .map((v) => ({ id: String(v.id), desc: String(v.desc || ""), tags: videoTags(v), cover: coverOf(v), keys: Object.keys(v) }))
    .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  return { info, videos };
}

async function fetchVideos(user = USER) {
  return (await fetchProfile(user)).videos;
}

// Usuarios etiquetados de verdad en un video (textExtra de la página del video), o null si TikTok no la deja leer
async function pageTags(user, id) {
  try {
    const res = await fetch(`https://www.tiktok.com/@${user}/video/${id}`, { headers: { "User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const m = (await res.text()).match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    const item = JSON.parse(m[1])?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;
    if (!item) return null;
    const tags = new Set(videoTags(item));
    for (const c of item.contents || []) for (const t of videoTags(c)) tags.add(t);
    return [...tags];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Miniatura: se descarga y se adjunta al mensaje (así se ve siempre, aunque Discord no pueda leer el link de TikTok)

async function downloadImage(src) {
  try {
    const res = await fetch(src, { headers: { "User-Agent": UA, Referer: "https://www.tiktok.com/" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > 7 * 1024 * 1024) return null;
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return new Discord.AttachmentBuilder(buf, { name: `tiktok.${ext}` });
  } catch {
    return null;
  }
}

async function oembedThumbnail(url) {
  for (const u of [url, url.replace("/video/", "/photo/")]) {
    try {
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const json = await res.json();
      if (json.thumbnail_url) return json.thumbnail_url;
    } catch {
      continue;
    }
  }
  return null;
}

async function thumbnail(video, url) {
  if (video.cover) {
    const f = await downloadImage(video.cover);
    if (f) return f;
  }
  const t = await oembedThumbnail(url);
  return t ? downloadImage(t) : null;
}

// ---------------------------------------------------------------------------------------------------------------
// Mensajes

// Rol de notificaciones de TikTok del servidor
function notifyRole(client, guild) {
  return guild.roles.cache.get(ROLE_ID) || (client.alertRole ? client.alertRole(guild, "tiktok") : null);
}

// Arma el mensaje: con miniatura va en un embed (y sin el link suelto); sin miniatura, se deja el link para que Discord lo despliegue
async function buildMessage({ video, url, rol, head, quote, authorName, authorUrl, buttons }) {
  const caption = Discord.escapeMarkdown(quote || "").slice(0, 300);
  const img = await thumbnail(video, url);
  const row = new Discord.ActionRowBuilder().addComponents(...buttons);
  const message = {
    content: `${rol ? `${rol} · ` : ""}${head}`,
    components: [row],
    allowedMentions: { parse: [], roles: rol ? [rol.id] : [] }, // nada de @everyone ni usuarios que venga en la descripción
  };
  if (img) {
    const embed = new Discord.EmbedBuilder().setColor(TIKTOK_COLOR).setTitle("🎬 Ver en TikTok").setURL(url).setImage(`attachment://${img.name}`);
    if (authorName) embed.setAuthor({ name: authorName.slice(0, 256), url: authorUrl });
    if (caption) embed.setDescription(caption);
    message.embeds = [embed];
    message.files = [img];
  } else {
    message.content += `${caption ? `\n> ${caption}` : ""}\n${url}`;
  }
  return message;
}

async function announcement(video, rol) {
  const url = `https://www.tiktok.com/@${USER}/video/${video.id}`;
  const title = video.desc.replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
  return buildMessage({
    video,
    url,
    rol,
    head: `🎬 **¡Nuevo video en nuestro TikTok!**\nDale like ❤️, comenta 💬 y compártelo 🔁 para que llegue a más gente.`,
    quote: title,
    authorName: `@${USER}`,
    authorUrl: `https://www.tiktok.com/@${USER}`,
    buttons: [
      new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel("Ver en TikTok").setEmoji("🎬").setURL(url),
      new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel(`Seguir a @${USER}`).setEmoji("➕").setURL(`https://www.tiktok.com/@${USER}`),
    ],
  });
}

async function mentionAnnouncement(video, rol, member) {
  const caption = video.desc.replace(/\s+/g, " ").trim();
  const buttons = [new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel("Ver en TikTok").setEmoji("🎬").setURL(video.url)];
  if (/^[\w.]+$/.test(video.author)) {
    buttons.push(new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel(`Perfil de @${video.author}`.slice(0, 80)).setEmoji("👤").setURL(`https://www.tiktok.com/@${video.author}`));
  }
  return buildMessage({
    video,
    url: video.url,
    rol,
    head: `📣 **¡Mencionaron a @${USER} en TikTok!**${video.author ? `\nPublicado por **@${Discord.escapeMarkdown(video.author)}**${member ? ` (<@${member}>)` : ""}` : ""}`,
    quote: caption,
    authorName: video.author ? `@${video.author}` : null,
    authorUrl: video.author ? `https://www.tiktok.com/@${video.author}` : undefined,
    buttons,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Menciones

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// "@usuario" suelto en un texto (sin letras pegadas ni un ".algo" detrás, que sería otra cuenta)
const MENTION_RE = new RegExp(`@${escapeRe(USER)}(?!\\w|\\.\\w)`, "i");
const nameRe = (n) => new RegExp(`@${escapeRe(n)}(?!\\w)`, "i");
const NAME_RES = MENTION_NAMES.map(nameRe);
let officialNick = null; // nombre para mostrar actual de la cuenta (se lee de su perfil)
let officialNickRe = null;
function setOfficialNick(info) {
  const nick = info && typeof info.nickname === "string" ? info.nickname.trim() : "";
  if (nick && nick !== officialNick) {
    officialNick = nick;
    officialNickRe = nameRe(nick);
  }
}

// Solo por el texto de la descripción: usuario o nombre para mostrar de la cuenta
function textMentions(desc) {
  return MENTION_RE.test(desc) || (officialNickRe && officialNickRe.test(desc)) || NAME_RES.some((re) => re.test(desc));
}

const tagCache = new Map(); // id del video -> usuarios etiquetados (páginas ya leídas)
async function mentionsUser(creator, v) {
  const me = USER.toLowerCase();
  if (v.tags.includes(me)) return true;
  if (!v.desc.includes("@")) return false; // sin "@" no hay etiqueta posible
  if (!tagCache.has(v.id)) {
    const tags = await pageTags(creator, v.id);
    await sleep(1000);
    if (!tags) return textMentions(v.desc); // no se pudo abrir: se decide por el texto y se reintenta la próxima vez
    tagCache.set(v.id, tags);
    if (tagCache.size > 5000) tagCache.delete(tagCache.keys().next().value);
  }
  return tagCache.get(v.id).includes(me);
}

// Videos recientes de cada creador de la lista que mencionan a @USER.
// Devuelve [{ creator, id, author, desc, url }] (más viejo primero); un creador que falla no frena a los demás.
async function fetchCreatorMentions(creators) {
  const out = [];
  const stats = { creators: 0, failed: 0, scanned: 0 };
  for (const creator of creators) {
    try {
      const videos = await fetchVideos(creator);
      stats.creators++;
      stats.scanned += videos.length;
      if (DEBUG) for (const v of videos) console.log(`[tiktok] debug @${creator} ${v.id} tags=[${v.tags}] portada=${v.cover ? "sí" : "no"} campos=[${v.keys}] desc="${v.desc.slice(0, 80)}"`);
      for (const v of videos) {
        if (!(await mentionsUser(creator, v))) continue; // solo valen los que de verdad mencionan a la cuenta
        out.push({ creator, id: v.id, author: creator, desc: v.desc, cover: v.cover, url: `https://www.tiktok.com/@${creator}/video/${v.id}` });
      }
    } catch (e) {
      stats.failed++;
      console.log(`[tiktok] @${creator}: ${e.message}`);
    }
    await sleep(2000); // sin ráfagas contra TikTok
  }
  out.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  out.stats = stats;
  return out;
}

module.exports = (client) => {
  let running = false;

  // Devuelve cuántos videos se anunciaron
  async function check() {
    if (running) return 0;
    running = true;
    let posted = 0;
    try {
      const profile = await fetchProfile();
      setOfficialNick(profile.info);
      const videos = profile.videos;
      let channels = 0;
      for (const guild of client.guilds.cache.values()) {
        const channel = textChannel(guild, /^tiktok$/);
        if (!channel) {
          console.log(`[tiktok] el servidor "${guild.name}" no tiene un canal de texto llamado "tiktok": no se publica nada ahí`);
          continue;
        }
        channels++;
        const seen = new Set((await tiktokVideos.find({ Guild: guild.id }).lean()).map((r) => r.Video));
        for (const v of videos) {
          if (seen.has(v.id)) continue; // ya publicado antes (está en la base de datos)
          const msg = await announcement(v, notifyRole(client, guild));
          const ok = await channel.send(msg).catch((e) => console.log("[tiktok]", e.message));
          if (!ok) continue; // no se apunta: se reintenta en la próxima vuelta
          await new tiktokVideos({ Guild: guild.id, Video: v.id, Date: Date.now() }).save();
          seen.add(v.id);
          posted++;
          await sleep(1000);
        }
      }
      console.log(`[tiktok] videos de @${USER}: ${videos.length} leídos, ${posted} anunciados (canales: ${channels})`);
    } catch (e) {
      console.log("[tiktok]", e.message);
    } finally {
      running = false;
    }
    return posted;
  }
  client.checkTikTok = check;

  let runningMentions = false;

  /*
   * Lee a los creadores (los del .env + los agregados con /tiktok add) y publica los videos que mencionan a la cuenta
   * y no estén ya en la base de datos. Cada servidor solo recibe los de SUS creadores.
   * opts.only = ["usuario"]: lee solo a esos creadores ahora mismo (lo usa /tiktok add; espera si ya hay una vuelta en curso).
   * Devuelve { posted, matched, scanned, read, failed, skipped }.
   */
  async function checkMentions(opts = {}) {
    const result = { posted: 0, matched: 0, scanned: 0, read: 0, failed: 0, skipped: false };
    if (!MENTIONS_ON) return { ...result, skipped: true };
    if (runningMentions) {
      if (!opts.only) return { ...result, skipped: true };
      for (let i = 0; i < 240 && runningMentions; i++) await sleep(500);
      if (runningMentions) return { ...result, skipped: true };
    }
    runningMentions = true;
    try {
      const rows = await tiktokCreators.find({}).lean();
      const memberOf = new Map(rows.filter((r) => r.Member).map((r) => [`${r.Guild}:${r.User}`, r.Member])); // creador -> miembro de Discord
      const byGuild = new Map();
      const setFor = (gid) => {
        if (!byGuild.has(gid)) byGuild.set(gid, new Set(ENV_CREATORS));
        return byGuild.get(gid);
      };
      for (const r of rows) setFor(r.Guild).add(r.User);
      const list = (opts.only || [...new Set([...ENV_CREATORS, ...rows.map((r) => r.User)])]).filter((c) => c !== USER.toLowerCase());
      if (!list.length) {
        console.log("[tiktok] menciones: no hay creadores en la lista (usa /tiktok add)");
        return result;
      }
      if (!officialNick) await fetchProfile().then((p) => setOfficialNick(p.info)).catch(() => {});
      const videos = await fetchCreatorMentions(list);
      let channels = 0;
      for (const guild of client.guilds.cache.values()) {
        const channel = textChannel(guild, /^tiktok$/);
        if (!channel) continue; // el aviso de falta de canal ya sale en check()
        channels++;
        const allowed = setFor(guild.id);
        const seen = new Set((await tiktokVideos.find({ Guild: guild.id }).lean()).map((r) => r.Video));
        for (const v of videos) {
          if (!allowed.has(v.creator)) continue; // este creador no está en la lista de este servidor
          result.matched++;
          if (seen.has(v.id)) continue; // ya publicado antes (está en la base de datos)
          const rol = MENTIONS_PING ? notifyRole(client, guild) : null;
          const msg = await mentionAnnouncement(v, rol, memberOf.get(`${guild.id}:${v.creator}`));
          const ok = await channel.send(msg).catch((e) => console.log("[tiktok]", e.message));
          if (!ok) continue; // no se apunta: se reintenta en la próxima vuelta
          await new tiktokVideos({ Guild: guild.id, Video: v.id, Date: Date.now() }).save();
          seen.add(v.id);
          result.posted++;
          await sleep(1000);
        }
      }
      const st = videos.stats;
      Object.assign(result, { scanned: st.scanned, read: st.creators, failed: st.failed });
      console.log(`[tiktok] menciones: ${st.creators}/${list.length} creadores leídos (${st.failed} con error), ${st.scanned} videos vistos, ${result.matched} mencionan a @${USER}, ${result.posted} anunciados (canales: ${channels})`);
    } catch (e) {
      console.log("[tiktok] menciones:", e.message);
    } finally {
      runningMentions = false;
    }
    return result;
  }
  client.checkTikTokMentions = checkMentions;

  // Herramientas para el comando /tiktok
  client.tiktokTools = {
    mainUser: USER,
    envCreators: ENV_CREATORS,
    normalizeCreator,
    // Comprueba que la cuenta exista y sea pública (lanza un error con el motivo si no se puede leer)
    verifyCreator: (user) => fetchProfile(user),
  };

  client.once(Discord.Events.ClientReady, () => {
    console.log(`[tiktok] activo: videos de @${USER} cada ${INTERVAL / 60000} min` + (MENTIONS_ON ? `, menciones de creadores cada ${MENTIONS_INTERVAL / 60000} min (rol ${ROLE_ID})` : ", menciones apagadas"));
    setTimeout(check, 45000);
    setInterval(check, INTERVAL);
    if (MENTIONS_ON) {
      setTimeout(checkMentions, 90000);
      setInterval(checkMentions, MENTIONS_INTERVAL);
    }
  });
};

// Para las pruebas
module.exports.normalizeCreator = normalizeCreator;
module.exports.textMentions = textMentions;
module.exports.setOfficialNick = setOfficialNick;
