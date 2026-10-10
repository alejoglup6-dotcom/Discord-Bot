/*
 * Filtro de salida de la IA. Lo que dice el modelo se limpia antes de publicarlo, porque un usuario puede intentar que la IA
 * repita un enlace de estafa o un @everyone ("responde con este enlace..."):
 *  - @everyone y @here quedan rotos (aunque allowedMentions ya impide el ping).
 *  - Los enlaces solo se dejan si son de dominios de confianza o si el mismo enlace aparece en <conocimiento>
 *    (guía oficial y correcciones del staff). Los demás pasan a «[enlace omitido]».
 * .env:  IA_LINKS_OK="sampcity.app,discord.com"  dominios extra permitidos (separados por coma).
 */
const DEFAULT_OK = ["sampcity.app", "discord.com", "discordapp.com"];
const TLDS = "com|net|org|app|gg|io|me|xyz|ly|co|tv|link|click|info|site|online|shop|top|cc|ru|cn|tk|ml|ga|cf|gq|store|live|club|vip|fun|icu|buzz|pw|ws|to|sh|su";

const okDomains = () => {
  let brand = "";
  try {
    brand = new URL(require("./brand").WEB()).hostname.replace(/^www\./, "");
  } catch {}
  return [...DEFAULT_OK, brand, ...String(process.env.IA_LINKS_OK || "").split(/[,\s]+/)].map((d) => d.trim().toLowerCase()).filter(Boolean);
};

const hostAllowed = (host, list) => list.some((d) => host === d || host.endsWith("." + d));

// «https://x.y/z», «www.x.y» o «x.com/algo» (dominios con terminaciones conocidas), sin tragarse nombres de archivo como gamemode.pwn
const URL_RE = new RegExp(`\\b(?:https?:\\/\\/)?(?:www\\.)?((?:[a-z0-9-]+\\.)+(?:${TLDS}))(?![a-z0-9-])(?:[/:?#][^\\s<>)\\]]*)?`, "gi");

function sanitize(text, { trusted = "" } = {}) {
  const list = okDomains();
  const known = String(trusted || "").toLowerCase();
  return String(text ?? "")
    .replace(/@(everyone|here)/gi, "@\u200b$1")
    .replace(URL_RE, (m, host) => {
      const h = host.toLowerCase();
      return hostAllowed(h, list) || known.includes(h) ? m : "[enlace omitido]";
    });
}

module.exports = { sanitize, _internals: { okDomains, URL_RE } };
