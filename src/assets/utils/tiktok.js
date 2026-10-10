/*
 * Lectura de perfiles de TikTok sin API: la página de "incrustar perfil" (https://www.tiktok.com/embed/@usuario) trae
 * los videos recientes en el JSON __FRONTITY_CONNECT_STATE__. La usan el aviso de videos de la cuenta oficial y el de
 * los creadores de contenido (src/handlers/functions/tiktok.js) y el comando /tiktok.
 */
const OFFICIAL = (process.env.TIKTOK_USER || "sampcity.oficial").replace(/^@/, "").toLowerCase();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// "@Usuario", "tiktok.com/@usuario/video/1", "https://www.tiktok.com/@usuario?lang=es" -> "usuario" (o null)
function cleanUser(input) {
  let s = String(input || "").trim();
  const url = s.match(/tiktok\.com\/@([^/?#\s]+)/i);
  if (url) s = url[1];
  s = s.replace(/^@/, "").toLowerCase();
  return /^[a-z0-9._]{2,24}$/.test(s) ? s : null;
}

function parseProfile(html) {
  const m = html.match(/<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("TikTok cambió la página de incrustar perfil");
  let list = null;
  let info = null;
  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (!list && Array.isArray(o.videoList)) list = o.videoList;
    if (!info && o.userInfo && o.userInfo.uniqueId) info = o.userInfo;
    for (const v of Object.values(o)) walk(v);
  })(JSON.parse(m[1]));
  const videos = (list || [])
    .filter((v) => v && /^\d+$/.test(String(v.id)) && !v.privateItem)
    .map((v) => ({ id: String(v.id), desc: String(v.desc || ""), cover: v.coverUrl || null }))
    // más antiguos primero (los ids de TikTok crecen con el tiempo)
    .sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  return { exists: !!list, user: info, videos };
}

// { exists, user: {uniqueId, nickname, avatarThumbUrl, followerCount...} | null, videos: [{id, desc, cover}] }
// exists es false si la cuenta no existe, es privada o no tiene videos públicos.
async function fetchProfile(user) {
  const res = await fetch(`https://www.tiktok.com/embed/@${encodeURIComponent(user)}`, {
    headers: { "User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9" },
  });
  if (res.status >= 500 || res.status === 429) throw new Error(`TikTok respondió ${res.status}`);
  const html = await res.text();
  if (!res.ok && !html.includes("__FRONTITY_CONNECT_STATE__")) return { exists: false, user: null, videos: [] };
  return parseProfile(html);
}

// ¿La descripción menciona a la cuenta oficial? (@sampcity.oficial, sin distinguir mayúsculas)
function mentionsOfficial(desc, official = OFFICIAL) {
  const esc = official.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`@${esc}(?![a-z0-9._])`, "i").test(String(desc || ""));
}

module.exports = { OFFICIAL, cleanUser, parseProfile, fetchProfile, mentionsOfficial };
