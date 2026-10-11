/*
 * Imágenes de /images (besar, nalgada, se busca, podio, cama, facepalm, clyde) dibujadas en el bot (12-oct-2026).
 * Antes salían de discord-image-generation, que necesita node-canvas (en el hosting no está bien instalado:
 * "registerFont is not a function" y el comando se quedaba pensando), y de canvacord, al que le faltan sus imágenes
 * base ("unsupported image source"). Aquí se usa canvasLib (@napi-rs/canvas), lo mismo que la tarjeta de bienvenida.
 * Todas devuelven un Buffer PNG.
 */
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("./canvasLib");

const FONT_DIR = path.join(__dirname, "../fonts");
let fontsReady = false;
function fonts() {
  if (fontsReady) return;
  registerFont(path.join(FONT_DIR, "Poppins-Bold.ttf"), "PoppinsBold");
  registerFont(path.join(FONT_DIR, "Poppins-Medium.ttf"), "PoppinsMedium");
  registerFont(path.join(FONT_DIR, "RussoOne-Regular.ttf"), "Russo");
  registerFont(path.join(FONT_DIR, "DejaVuSans-Bold.ttf"), "DejaVuBold");
  fontsReady = true;
}

/** Avatar como imagen; si no se puede bajar, un círculo gris con la inicial (la imagen sale igual). */
async function avatar(url, nombre = "?") {
  try {
    return await loadImage(url);
  } catch {
    const c = createCanvas(256, 256);
    const x = c.getContext("2d");
    x.fillStyle = "#5865f2";
    x.fillRect(0, 0, 256, 256);
    x.fillStyle = "#fff";
    x.font = "140px PoppinsBold";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(String(nombre).trim().charAt(0).toUpperCase() || "?", 128, 138);
    return c;
  }
}

function circulo(ctx, img, cx, cy, r, borde = "#fff", grosor = 8) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  if (grosor) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = grosor;
    ctx.strokeStyle = borde;
    ctx.stroke();
  }
}

function corazon(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 100, s / 100);
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-60, -10, -50, -70, 0, -40);
  ctx.bezierCurveTo(50, -70, 60, -10, 0, 30);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function fondo(ctx, w, h, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function texto(ctx, t, x, y, { size = 40, font = "PoppinsBold", color = "#fff", align = "center", max = 0, sombra = true } = {}) {
  ctx.save();
  ctx.font = `${size}px ${font}`;
  if (max) while (ctx.measureText(t).width > max && size > 12) ctx.font = `${(size -= 2)}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if (sombra) {
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillText(t, x + 3, y + 3);
  }
  ctx.fillStyle = color;
  ctx.fillText(t, x, y);
  ctx.restore();
}

/** Estallido de cómic (estrella de puntas) con texto. */
function estallido(ctx, cx, cy, r, t, color = "#ffd23f") {
  ctx.save();
  ctx.beginPath();
  const puntas = 14;
  for (let i = 0; i <= puntas * 2; i++) {
    const a = (Math.PI * i) / puntas, rr = i % 2 ? r * 0.62 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1a1a1a";
  ctx.stroke();
  ctx.restore();
  texto(ctx, t, cx, cy + 2, { size: r * 0.42, font: "Russo", color: "#e63946", max: r * 1.2 });
}

async function besar(urlA, urlB, nombreA, nombreB) {
  fonts();
  const [a, b] = await Promise.all([avatar(urlA, nombreA), avatar(urlB, nombreB)]);
  const W = 800, H = 420, c = createCanvas(W, H), ctx = c.getContext("2d");
  fondo(ctx, W, H, "#ff6fa5", "#ff9a8b");
  for (let i = 0; i < 18; i++) corazon(ctx, Math.random() * W, Math.random() * H, 20 + Math.random() * 40, "rgba(255,255,255,.22)");
  circulo(ctx, a, 220, 200, 140);
  circulo(ctx, b, 580, 200, 140);
  corazon(ctx, 400, 215, 150, "#e63946");
  texto(ctx, `${nombreA} besó a ${nombreB}`, 400, 380, { size: 38, max: 740 });
  return c.toBuffer("image/png");
}

async function nalgada(urlA, urlB, nombreA, nombreB) {
  fonts();
  const [a, b] = await Promise.all([avatar(urlA, nombreA), avatar(urlB, nombreB)]);
  const W = 800, H = 420, c = createCanvas(W, H), ctx = c.getContext("2d");
  fondo(ctx, W, H, "#3a0ca3", "#7209b7");
  circulo(ctx, a, 210, 190, 130);
  // líneas de movimiento
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 6;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(370, 190 + i * 28);
    ctx.lineTo(440, 190 + i * 22);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(590, 215);
  ctx.rotate(0.18);
  circulo(ctx, b, 0, 0, 120, "#ffd23f", 10);
  ctx.restore();
  estallido(ctx, 470, 95, 82, "¡PLAF!");
  texto(ctx, `${nombreA} le da una nalgada a ${nombreB}`, 400, 380, { size: 34, max: 760 });
  return c.toBuffer("image/png");
}

async function seBusca(url, nombre, recompensa = "$1.000.000") {
  fonts();
  const img = await avatar(url, nombre);
  const W = 520, H = 720, c = createCanvas(W, H), ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 480);
  g.addColorStop(0, "#f3dfb0");
  g.addColorStop(1, "#c79a57");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#5b3a1a";
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  texto(ctx, "SE BUSCA", W / 2, 95, { size: 84, font: "Russo", color: "#3b2410", sombra: false, max: W - 70 });
  texto(ctx, "VIVO O MUERTO", W / 2, 160, { size: 30, font: "PoppinsBold", color: "#3b2410", sombra: false });
  // foto en sepia
  const f = createCanvas(360, 360), fx = f.getContext("2d");
  fx.drawImage(img, 0, 0, 360, 360);
  const d = fx.getImageData(0, 0, 360, 360);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
    d.data[i] = Math.min(255, r * 0.393 + gg * 0.769 + b * 0.189);
    d.data[i + 1] = Math.min(255, r * 0.349 + gg * 0.686 + b * 0.168);
    d.data[i + 2] = Math.min(255, r * 0.272 + gg * 0.534 + b * 0.131);
  }
  fx.putImageData(d, 0, 0);
  ctx.drawImage(f, 80, 195);
  ctx.lineWidth = 6;
  ctx.strokeRect(80, 195, 360, 360);
  texto(ctx, String(nombre).toUpperCase(), W / 2, 600, { size: 40, font: "Russo", color: "#3b2410", sombra: false, max: W - 80 });
  texto(ctx, `RECOMPENSA ${recompensa}`, W / 2, 660, { size: 32, font: "PoppinsBold", color: "#7a1f10", sombra: false, max: W - 80 });
  return c.toBuffer("image/png");
}

async function podio(usuarios) {
  fonts();
  const imgs = await Promise.all(usuarios.map((u) => avatar(u.avatar, u.nombre)));
  const W = 900, H = 560, c = createCanvas(W, H), ctx = c.getContext("2d");
  fondo(ctx, W, H, "#141e30", "#243b55");
  // [lugar, x, alto del bloque, color]
  const pos = [[1, 450, 230, "#f4c430"], [2, 210, 170, "#c0c0c0"], [3, 690, 120, "#cd7f32"]];
  for (const [lugar, x, alto, color] of pos) {
    const i = lugar - 1, top = H - alto;
    ctx.fillStyle = color;
    ctx.fillRect(x - 120, top, 240, alto);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(x - 120, top, 240, 14);
    texto(ctx, String(lugar), x, top + alto / 2 + 6, { size: 90, font: "Russo", color: "#fff" });
    circulo(ctx, imgs[i], x, top - 95, 80, color, 8);
    texto(ctx, usuarios[i].nombre, x, top - 195, { size: 28, max: 230 });
  }
  return c.toBuffer("image/png");
}

async function cama(urlA, urlB, nombreA, nombreB) {
  fonts();
  const [a, b] = await Promise.all([avatar(urlA, nombreA), avatar(urlB, nombreB)]);
  const W = 800, H = 520, c = createCanvas(W, H), ctx = c.getContext("2d");
  fondo(ctx, W, H, "#0b132b", "#1c2541");
  // luna
  ctx.fillStyle = "#f6f1d5";
  ctx.beginPath();
  ctx.arc(680, 80, 40, 0, Math.PI * 2);
  ctx.fill();
  // cama
  ctx.fillStyle = "#6d4c41";
  ctx.fillRect(90, 230, 620, 40);
  ctx.fillRect(90, 140, 30, 250);
  ctx.fillRect(680, 190, 30, 200);
  ctx.fillStyle = "#e0e7ff";
  ctx.fillRect(120, 200, 560, 34);
  ctx.fillStyle = "#4361ee";
  ctx.fillRect(260, 186, 420, 48);
  circulo(ctx, a, 190, 170, 62, "#e0e7ff", 6);
  texto(ctx, "Zzz", 290, 100, { size: 40, font: "Russo", color: "#cdd6ff" });
  // debajo de la cama, en la oscuridad
  ctx.fillStyle = "#05070f";
  ctx.fillRect(120, 270, 560, 120);
  ctx.globalAlpha = 0.85;
  circulo(ctx, b, 560, 330, 52, "#e63946", 5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ff3b3b";
  for (const ex of [535, 585]) {
    ctx.beginPath();
    ctx.arc(ex, 300, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  texto(ctx, `${nombreA} durmiendo tranquilo...`, W / 2, 440, { size: 30, max: 760 });
  texto(ctx, `...sin saber que ${nombreB} está debajo de la cama`, W / 2, 485, { size: 26, color: "#ffb4b4", max: 760 });
  return c.toBuffer("image/png");
}

async function facepalm(url, nombre) {
  fonts();
  const img = await avatar(url, nombre);
  const W = 640, H = 520, c = createCanvas(W, H), ctx = c.getContext("2d");
  fondo(ctx, W, H, "#2b2d42", "#4a4e69");
  circulo(ctx, img, W / 2, 230, 170);
  // mano sobre la cara: palma y dedos
  ctx.save();
  ctx.translate(W / 2 + 10, 215);
  ctx.rotate(-0.25);
  ctx.fillStyle = "#f1c27d";
  ctx.strokeStyle = "#a0703c";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 40, 95, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(-66 + i * 44, -55, 20, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  texto(ctx, "*facepalm*", W / 2, 455, { size: 52, font: "Russo", color: "#ffd23f" });
  return c.toBuffer("image/png");
}

/** Mensaje de Clyde (el bot de Discord) con el texto que se le pase. */
async function clyde(mensaje) {
  fonts();
  const W = 900, PAD = 24, X = 110;
  const medir = createCanvas(10, 10).getContext("2d");
  medir.font = "26px PoppinsMedium";
  const lineas = [];
  for (const parrafo of String(mensaje || "").split("\n")) {
    let actual = "";
    for (const p of parrafo.split(/\s+/)) {
      const prueba = actual ? `${actual} ${p}` : p;
      if (medir.measureText(prueba).width > W - X - PAD && actual) { lineas.push(actual); actual = p; }
      else actual = prueba;
    }
    lineas.push(actual);
  }
  const H = Math.max(150, 90 + lineas.length * 36 + PAD);
  const c = createCanvas(W, H), ctx = c.getContext("2d");
  ctx.fillStyle = "#313338";
  ctx.fillRect(0, 0, W, H);
  // avatar de Clyde
  ctx.fillStyle = "#5865f2";
  ctx.beginPath();
  ctx.arc(55, 60, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(38, 48, 34, 22);
  ctx.fillStyle = "#5865f2";
  ctx.fillRect(44, 54, 6, 8);
  ctx.fillRect(60, 54, 6, 8);
  texto(ctx, "Clyde", X, 42, { size: 26, font: "PoppinsBold", color: "#f2f3f5", align: "left", sombra: false });
  const ancho = (() => { ctx.font = "26px PoppinsBold"; return ctx.measureText("Clyde").width; })();
  ctx.fillStyle = "#5865f2";
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(X + ancho + 10, 30, 52, 24, 5) : ctx.rect(X + ancho + 10, 30, 52, 24);
  ctx.fill();
  texto(ctx, "BOT", X + ancho + 36, 43, { size: 15, font: "PoppinsBold", sombra: false });
  texto(ctx, "Hoy", X + ancho + 75, 43, { size: 16, font: "PoppinsMedium", color: "#949ba4", align: "left", sombra: false });
  lineas.forEach((l, i) => texto(ctx, l, X, 84 + i * 36, { size: 26, font: "PoppinsMedium", color: "#dbdee1", align: "left", sombra: false }));
  return c.toBuffer("image/png");
}

module.exports = { besar, nalgada, seBusca, podio, cama, facepalm, clyde };
