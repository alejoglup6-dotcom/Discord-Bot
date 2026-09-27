// Retrato de la skin tipo foto de identificación: de la cabeza al pecho, ampliado, con fondo transparente
// y una luz desde atrás: un resplandor suave alrededor y los bordes del personaje un poco iluminados.
// Parte de la imagen de cuerpo entero (open.mp o SAMP_SKIN_URL) y busca la figura por los píxeles no transparentes.
const { createCanvas, loadImage, libName } = require("./canvasLib");

const SIZE = 256;
const GLOW = 22; // difuminado del resplandor de atrás, en px
const RIM = 0.45; // intensidad de la luz en los bordes del personaje (0-1)
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

  // Silueta blanca del personaje
  const silhouette = createCanvas(SIZE, SIZE);
  const sctx2 = silhouette.getContext("2d");
  sctx2.drawImage(figure, 0, 0);
  sctx2.globalCompositeOperation = "source-in";
  sctx2.fillStyle = "#ffffff";
  sctx2.fillRect(0, 0, SIZE, SIZE);

  // Versión difuminada de una imagen blanca. @napi-rs/canvas tiene filtro de desenfoque; node-canvas no, así que
  // ahí se usa la sombra de la imagen dibujada fuera del lienzo (en @napi-rs/canvas ese truco no dibuja nada).
  const blurred = (ctx, image, blur, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (libName() === "@napi-rs/canvas") {
      ctx.filter = `blur(${blur / 2}px)`;
      ctx.drawImage(image, 0, 0);
    } else {
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = SIZE * 2;
      ctx.drawImage(image, -SIZE * 2, 0);
    }
    ctx.restore();
  };

  // Luz en los bordes: lo de fuera del personaje, difuminado hacia dentro y recortado a su forma
  const outside = createCanvas(SIZE, SIZE);
  const octx = outside.getContext("2d");
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, SIZE, SIZE);
  octx.globalCompositeOperation = "destination-out";
  octx.drawImage(figure, 0, 0);
  const rim = createCanvas(SIZE, SIZE);
  const rctx = rim.getContext("2d");
  blurred(rctx, outside, 10, 1);
  rctx.globalCompositeOperation = "destination-in";
  rctx.drawImage(figure, 0, 0);

  // Fondo transparente: resplandor de atrás, el personaje y la luz de los bordes encima
  const out = createCanvas(SIZE, SIZE);
  const ctx = out.getContext("2d");
  blurred(ctx, silhouette, GLOW, 0.9);
  blurred(ctx, silhouette, GLOW / 2, 0.6);
  ctx.drawImage(figure, 0, 0);
  ctx.globalAlpha = RIM;
  ctx.drawImage(rim, 0, 0);
  ctx.globalAlpha = 1;

  const png = out.toBuffer("image/png");
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  cache.set(url, png);
  return png;
}

module.exports = { skinPortrait };
