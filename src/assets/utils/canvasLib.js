/*
 * Librería de imágenes para las tarjetas y la foto de la skin.
 * Primero @napi-rs/canvas (viene compilada con canvacord y no necesita nada del sistema) y, si no está,
 * canvas (node-canvas, que en muchos hostings no se instala bien). Las imágenes remotas se descargan con
 * fetch y se pasan como Buffer, que funciona igual en las dos.
 */
let lib = null;
let loadError = null;

function load() {
  if (lib) return lib;
  const errors = [];
  try {
    const n = require("@napi-rs/canvas");
    lib = {
      name: "@napi-rs/canvas",
      createCanvas: n.createCanvas,
      loadImage: n.loadImage,
      registerFont: (file, family) => n.GlobalFonts.registerFromPath(file, family),
    };
    return lib;
  } catch (err) {
    errors.push(`@napi-rs/canvas: ${err.message.split("\n")[0]}`);
  }
  try {
    const c = require("canvas");
    lib = {
      name: "canvas",
      createCanvas: c.createCanvas,
      loadImage: c.loadImage,
      registerFont: (file, family) => c.registerFont(file, { family }),
    };
    return lib;
  } catch (err) {
    errors.push(`canvas: ${err.message.split("\n")[0]}`);
  }
  loadError = new Error(`No hay librería de imágenes (${errors.join(" | ")})`);
  throw loadError;
}

async function loadImage(source) {
  const { loadImage: li } = load();
  if (typeof source === "string" && /^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`No se pudo descargar la imagen (${res.status}): ${source}`);
    return li(Buffer.from(await res.arrayBuffer()));
  }
  return li(source);
}

module.exports = {
  load,
  loadImage,
  createCanvas: (w, h) => load().createCanvas(w, h),
  registerFont: (file, family) => load().registerFont(file, family),
  libName: () => {
    try {
      return load().name;
    } catch {
      return null;
    }
  },
};
