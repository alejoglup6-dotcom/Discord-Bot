// Retrato de la skin tipo foto de identificación: de la cabeza al pecho, ampliado y con fondo liso.
// Parte de la imagen de cuerpo entero (open.mp o SAMP_SKIN_URL) y busca la figura por los píxeles no transparentes.
const { createCanvas, loadImage } = require("canvas");

const SIZE = 256;
const cache = new Map(); // skin -> PNG (las imágenes no cambian)

async function skinPortrait(url) {
  if (cache.has(url)) return cache.get(url);

  const img = await loadImage(url);
  const src = createCanvas(img.width, img.height);
  const sctx = src.getContext("2d");
  sctx.drawImage(img, 0, 0);
  const { data } = sctx.getImageData(0, 0, img.width, img.height);
  const opaque = (x, y) => data[(y * img.width + x) * 4 + 3] > 20;

  // Alto de la figura
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < img.height && top < 0; y++) for (let x = 0; x < img.width; x++) if (opaque(x, y)) { top = y; break; }
  for (let y = img.height - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < img.width; x++) if (opaque(x, y)) { bottom = y; break; }
  if (top < 0) throw new Error("imagen vacía");
  const height = bottom - top;

  // Centro de la cabeza: media de las columnas opacas en la parte de arriba de la figura
  let sum = 0;
  let count = 0;
  for (let y = top; y < top + height * 0.12; y++) {
    for (let x = 0; x < img.width; x++) if (opaque(x, y)) { sum += x; count++; }
  }
  const centerX = count ? sum / count : img.width / 2;

  // Cuadro de la cabeza al pecho (~34% de la figura) con un poco de aire encima
  const side = Math.round(height * 0.34);
  const sx = Math.round(centerX - side / 2);
  const sy = Math.max(0, top - Math.round(side * 0.08));

  const out = createCanvas(SIZE, SIZE);
  const ctx = out.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, 0, SIZE);
  bg.addColorStop(0, "#d9e2ec");
  bg.addColorStop(1, "#9fb3c8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, sx, sy, side, side, 0, 0, SIZE, SIZE);

  const png = out.toBuffer("image/png");
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  cache.set(url, png);
  return png;
}

module.exports = { skinPortrait };
