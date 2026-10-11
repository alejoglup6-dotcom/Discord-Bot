/*
 * Gifs de anime para acciones (abrazar, besar...). Cada página se cae o bloquea a ratos (nekos.best da 403 sin su
 * formato de User-Agent; waifu.pics no contesta): se prueban varias en orden y gana la primera que dé un gif.
 */
const { pedirJson } = require("./apiExterna");

const UA = "SampCityBot (https://sampcity.app, 1.0)";

// Cada fuente: url para la acción y cómo sacar el gif de la respuesta. Acciones con su nombre en cada página.
const FUENTES = [
  { nombre: "otakugifs", url: (a) => `https://api.otakugifs.xyz/gif?reaction=${a}`, gif: (j) => j && j.url },
  { nombre: "purrbot", url: (a) => `https://purrbot.site/api/img/sfw/${a}/gif`, gif: (j) => j && !j.error && j.link },
  { nombre: "nekos.life", url: (a) => `https://nekos.life/api/v2/img/${a}`, gif: (j) => j && j.url },
  { nombre: "nekos.best", url: (a) => `https://nekos.best/api/v2/${a}`, gif: (j) => j && j.results && j.results[0] && j.results[0].url },
];

/**
 * @param {string} accion hug, kiss, pat, slap, cuddle...
 * @returns {Promise<string>} url del gif
 */
async function gifAccion(accion) {
  const errores = [];
  for (const f of FUENTES) {
    try {
      const j = await pedirJson(f.url(accion), { headers: { "User-Agent": UA }, timeout: 6000, intentos: 1 });
      const url = f.gif(j);
      if (url && /^https?:\/\//.test(url)) return url;
      errores.push(`${f.nombre}: sin gif`);
    } catch (e) {
      errores.push(`${f.nombre}: ${e.message}`);
    }
  }
  const err = new Error(`ninguna página de gifs contestó (${errores.join("; ")})`);
  err.detalle = errores;
  throw err;
}

module.exports = { gifAccion, FUENTES };
