// Retrato de la skin tipo foto de identificación: de la cabeza al pecho, ampliado, con fondo transparente
// y un borde blanco alrededor del personaje.
// Parte de la imagen de cuerpo entero (open.mp o SAMP_SKIN_URL) y busca la figura por los píxeles no transparentes.
const { createCanvas, loadImage } = require("canvas");

const SIZE = 256;
const OUTLINE = 5; // grosor del borde blanco en px
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

  // Cuadro de la cabeza al pecho (~34% de la figura, los hombros llegan a los lados) y aire encima para el borde
  const side = Math.round(height * 0.34);
  const sx = Math.round(centerX - side / 2);
  const sy = top - Math.round(side * 0.06);

  // Personaje recortado y ampliado
  const figure = createCanvas(SIZE, SIZE);
  const fctx = figure.getContext("2d");
  fctx.imageSmoothingEnabled = true;
  fctx.imageSmoothingQuality = "high";
  fctx.drawImage(src, sx, sy, side, side, 0, 0, SIZE, SIZE);

  // Silueta blanca para el borde
  const silhouette = createCanvas(SIZE, SIZE);
  const sctx2 = silhouette.getContext("2d");
  sctx2.drawImage(figure, 0, 0);
  sctx2.globalCompositeOperation = "source-in";
  sctx2.fillStyle = "#ffffff";
  sctx2.fillRect(0, 0, SIZE, SIZE);

  // Fondo transparente: la silueta repetida alrededor forma el borde y encima va el personaje
  const out = createCanvas(SIZE, SIZE);
  const ctx = out.getContext("2d");
  for (let a = 0; a < 360; a += 15) {
    const r = (a * Math.PI) / 180;
    ctx.drawImage(silhouette, Math.round(Math.cos(r) * OUTLINE), Math.round(Math.sin(r) * OUTLINE));
  }
  ctx.drawImage(figure, 0, 0);

  const png = out.toBuffer("image/png");
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  cache.set(url, png);
  return png;
}

module.exports = { skinPortrait };
