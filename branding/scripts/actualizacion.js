/*
 * Imágenes de la actualización del 3-oct-2026 al estilo de las portadas de GTA San Andreas: viñetas ilustradas con
 * bordes negros gruesos, color cálido de Los Santos, contornos entintados y trama de puntos en las sombras.
 * Las escenas son renders reales del juego hechos con tools/render del repo Backup (modelos de GTA SA, vehículos
 * incluidos) y aquí se "pintan" y se montan con el logo 3D de la marca.
 *
 * Uso (desde la raíz del repo): node branding/scripts/actualizacion.js <carpeta con los renders> [salida]
 *   renders esperados (1920x1080): cartel.png piloto.png ladron.png traficante.png facciones.png saem.png
 *   salida por defecto: branding/marca/actualizacion-3oct/ (portada, trabajos, facciones y cartel en JPG)
 */
const path = require("path");
const fs = require("fs");
const { loadImage } = require("@napi-rs/canvas");
const { createCanvas, GlobalFonts, P, PAIRS, wordmark, wm } = require("./lib");
GlobalFonts.registerFromPath(path.join(__dirname, "../fonts/Poppins-ExtraBold.ttf"), "PXB");
GlobalFonts.registerFromPath(path.join(__dirname, "../fonts/LuckiestGuy-Regular.ttf"), "Lucky");

const IN = path.resolve(process.argv[2] || ".");
const OUT = path.resolve(process.argv[3] || path.join(__dirname, "../marca/actualizacion-3oct"));
fs.mkdirSync(OUT, { recursive: true });
const INK = "#0a0202";

// ---------------------------------------------------------------- "pintar" un render
const GRADES = {
  // [multiplicador r,g,b], saturacion, contraste, brillo, color del cielo/neblina arriba
  dia: { mul: [1.08, 1.0, 0.86], sat: 1.25, con: 1.12, bri: 1.02, haze: "rgba(255,170,90,.22)" },
  tarde: { mul: [1.16, 0.95, 0.78], sat: 1.3, con: 1.15, bri: 1.0, haze: "rgba(255,120,60,.32)" },
  noche: { mul: [0.6, 0.68, 1.0], sat: 0.95, con: 1.18, bri: 0.74, haze: "rgba(40,60,140,.35)" },
  nochemorada: { mul: [0.78, 0.62, 1.0], sat: 1.0, con: 1.18, bri: 0.78, haze: "rgba(110,40,160,.35)" },
};

function paint(img, gradeName, glows = []) {
  const G = GRADES[gradeName];
  const W = img.width, H = img.height;
  const cv = createCanvas(W, H), c = cv.getContext("2d");
  c.drawImage(img, 0, 0);
  const id = c.getImageData(0, 0, W, H), d = id.data;
  // luminancia suavizada para los contornos
  const L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) L[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  const S = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    let s = 0; for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) s += L[(y + j) * W + x + k]; S[y * W + x] = s / 9;
  }
  const step = 26;   // bandas de color (posterizado suave)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, o = i * 4;
    let r = d[o], g = d[o + 1], b = d[o + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    r = l + (r - l) * G.sat; g = l + (g - l) * G.sat; b = l + (b - l) * G.sat;
    r = ((r / 255 - 0.5) * G.con + 0.5) * 255 * G.bri * G.mul[0];
    g = ((g / 255 - 0.5) * G.con + 0.5) * 255 * G.bri * G.mul[1];
    b = ((b / 255 - 0.5) * G.con + 0.5) * 255 * G.bri * G.mul[2];
    r = Math.round(r / step) * step * 0.3 + r * 0.7; g = Math.round(g / step) * step * 0.3 + g * 0.7; b = Math.round(b / step) * step * 0.3 + b * 0.7;
    // tinta: gradiente fuerte = linea negra
    let e = 0;
    if (x > 0 && y > 0 && x < W - 1 && y < H - 1) {
      const gx = S[i - W + 1] + 2 * S[i + 1] + S[i + W + 1] - S[i - W - 1] - 2 * S[i - 1] - S[i + W - 1];
      const gy = S[i + W - 1] + 2 * S[i + W] + S[i + W + 1] - S[i - W - 1] - 2 * S[i - W] - S[i - W + 1];
      e = Math.min(1, Math.max(0, (Math.hypot(gx, gy) - 0.16) / 0.22));
    }
    const k = 1 - e * 0.88;
    d[o] = Math.max(0, Math.min(255, r * k)); d[o + 1] = Math.max(0, Math.min(255, g * k)); d[o + 2] = Math.max(0, Math.min(255, b * k));
  }
  c.putImageData(id, 0, 0);
  // neblina de color arriba (cielo de Los Santos) y viñeta
  let gr = c.createLinearGradient(0, 0, 0, H * 0.6); gr.addColorStop(0, G.haze); gr.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  // luces (sirenas, farolas...)
  for (const [x, y, r, col] of glows) {
    c.save(); c.globalCompositeOperation = "lighter";
    const g2 = c.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, col); g2.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g2; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }
  gr = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.45)");
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  // trama de puntos en las sombras (como la impresion de las portadas)
  const sp = 7;
  c.fillStyle = "rgba(10,2,2,.28)";
  for (let y = sp; y < H; y += sp) for (let x = sp + ((y / sp) % 2) * (sp / 2); x < W; x += sp) {
    const l = S[Math.min(H - 1, y | 0) * W + Math.min(W - 1, x | 0)] * G.bri;
    if (l > 0.42) continue;
    c.beginPath(); c.arc(x, y, (0.42 - l) * 4.2, 0, 7); c.fill();
  }
  return cv;
}

// ---------------------------------------------------------------- piezas de maquetacion
// Viñeta: imagen recortada (cover) en un rectangulo con borde negro grueso. f = [fx, fy, zoom] centro del recorte.
function panel(c, src, x, y, w, h, f = [0.5, 0.5, 1]) {
  const [fx, fy, z] = f;
  const scale = Math.max(w / src.width, h / src.height) * z;
  const sw = w / scale, sh = h / scale;
  const sx = Math.max(0, Math.min(src.width - sw, src.width * fx - sw / 2)), sy = Math.max(0, Math.min(src.height - sh, src.height * fy - sh / 2));
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.drawImage(src, sx, sy, sw, sh, x, y, w, h);
  c.restore();
  c.lineWidth = 10; c.strokeStyle = INK; c.strokeRect(x + 5, y + 5, w - 10, h - 10);
}

// Rotulo: caja negra con texto blanco (como los titulos de las portadas) y una franja de color de la marca
function label(c, text, x, y, size = 46, align = "left", stripe = "#E8392F", sub = null) {
  c.save();
  c.font = `${size}px PBlack`; c.textBaseline = "middle";
  const tw = c.measureText(text).width, padX = size * 0.45, h = size * 1.35;
  let sw = 0; if (sub) { c.font = `${Math.round(size * 0.48)}px PXB`; sw = c.measureText(sub).width; }
  const w = Math.max(tw, sw) + padX * 2, H2 = h + (sub ? size * 0.7 : 0);
  const bx = align === "right" ? x - w : x;
  c.fillStyle = INK; c.fillRect(bx, y, w, H2);
  c.fillStyle = stripe; c.fillRect(bx, y + H2 - 7, w, 7);
  c.font = `${size}px PBlack`; c.fillStyle = "#ffffff"; c.fillText(text, bx + padX, y + h / 2 + 2);
  if (sub) { c.font = `${Math.round(size * 0.48)}px PXB`; c.fillStyle = "#FFC9C4"; c.fillText(sub, bx + padX, y + h + size * 0.22); }
  c.restore();
  return w;
}

// Texto grande con contorno negro grueso (estilo carteles del juego)
function bigText(c, text, x, y, size, fill = "#ffffff", align = "left", font = "PBlack") {
  c.save(); c.font = `${size}px ${font}`; c.textAlign = align; c.textBaseline = "alphabetic"; c.lineJoin = "round";
  c.lineWidth = size * 0.22; c.strokeStyle = INK; c.strokeText(text, x, y);
  c.fillStyle = fill; c.fillText(text, x, y); c.restore();
}

function sunsetBox(c, x, y, w, h) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#1A0612"); g.addColorStop(0.45, "#5A0F1F"); g.addColorStop(0.8, "#D9442F"); g.addColorStop(1, "#FFB35C");
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = g; c.fillRect(x, y, w, h);
  // rayos de sol
  c.translate(x + w * 0.5, y + h * 1.05);
  for (let i = 0; i < 18; i++) { c.rotate(Math.PI / 18); c.fillStyle = i % 2 ? "rgba(255,200,120,.08)" : "rgba(255,90,60,.05)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, -50); c.lineTo(w, 50); c.fill(); }
  c.restore();
  // edificios y palmeras en silueta
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  let s = 3; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  c.fillStyle = "rgba(20,4,10,.85)";
  for (let bx = x; bx < x + w; bx += 40 + rnd() * 50) { const bh = h * (0.12 + rnd() * 0.28); c.fillRect(bx, y + h - bh, 34 + rnd() * 40, bh); }
  c.restore();
  c.lineWidth = 10; c.strokeStyle = INK; c.strokeRect(x + 5, y + 5, w - 10, h - 10);
}

function drawLogo(c, cx, cy, width) {
  const logo = wm(PAIRS.principal, { size: 200, depth: 22 });
  const h = (logo.height * width) / logo.width;
  c.drawImage(logo, cx - width / 2, cy - h / 2, width, h);
  return h;
}

function save(cv, name) {
  const f = path.join(OUT, name + ".jpg");
  fs.writeFileSync(f, cv.toBuffer("image/jpeg", 92));
  console.log("ok", f);
}

(async () => {
  const L = async (n) => loadImage(path.join(IN, n + ".png"));
  console.log("pintando escenas...");
  const img = {
    cartel: paint(await L("cartel"), "dia"),
    piloto: paint(await L("piloto"), "dia", [[1640, 300, 160, "rgba(255,220,150,.18)"]]),
    ladron: paint(await L("ladron"), "noche", [
      [1200, 700, 230, "rgba(255,40,40,.55)"], [1330, 660, 230, "rgba(40,90,255,.55)"], [1430, 640, 200, "rgba(255,40,40,.4)"],
      [820, 190, 140, "rgba(220,230,255,.45)"], [640, 520, 120, "rgba(255,120,200,.35)"], [1500, 540, 140, "rgba(255,200,90,.3)"],
    ]),
    traficante: paint(await L("traficante"), "nochemorada", [
      [1240, 520, 260, "rgba(140,255,140,.22)"], [600, 300, 200, "rgba(255,190,90,.3)"], [1650, 260, 160, "rgba(255,190,90,.3)"],
    ]),
    facciones: paint(await L("facciones"), "dia", [[1100, 250, 120, "rgba(255,40,40,.25)"], [1210, 230, 120, "rgba(40,90,255,.25)"]]),
    saem: paint(await L("saem"), "tarde"),
  };

  // ---------------- 1. portada de la actualizacion ----------------
  {
    const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext("2d");
    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    const g = 12;
    panel(c, img.cartel, g, g, 748, 508, [0.48, 0.5, 1.25]);
    panel(c, img.piloto, 772, g, 566, 388, [0.55, 0.45, 1.15]);
    panel(c, img.saem, 1350, g, 558, 388, [0.5, 0.55, 1.1]);
    sunsetBox(c, 772, 412, 1136, 256);
    panel(c, img.facciones, g, 532, 748, 536, [0.62, 0.55, 1.15]);
    panel(c, img.ladron, 772, 680, 566, 388, [0.55, 0.55, 1.1]);
    panel(c, img.traficante, 1350, 680, 558, 388, [0.55, 0.55, 1.15]);
    // logo y titulo en la franja del atardecer
    drawLogo(c, 1110, 532, 560);
    bigText(c, "ACTUALIZACIÓN", 1420, 520, 64, "#ffffff", "left", "Lucky");
    bigText(c, "3 DE OCTUBRE", 1420, 600, 52, "#FFB35C", "left", "Lucky");
    bigText(c, "ANDROID Y PC", 1420, 650, 30, "#FFC9C4", "left", "PBlack");
    label(c, "CARTEL SAMPCITY", 34, 30, 34);
    label(c, "PILOTO", 794, 30, 34, "left", "#4fd8ff");
    label(c, "BASE SAEM · ÁREA 51", 1886, 30, 34, "right", "#8E8C46");
    label(c, "FACCIONES", 34, 552, 34, "left", "#2A77A1");
    label(c, "LADRÓN", 794, 1000, 34, "left", "#E8392F");
    label(c, "TRAFICANTE", 1886, 1000, 34, "right", "#9B59B6");
    save(cv, "portada");
  }

  // ---------------- 2. trabajos nuevos ----------------
  {
    const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext("2d");
    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    sunsetBox(c, 12, 12, 1896, 170);
    drawLogo(c, 250, 97, 380);
    bigText(c, "NUEVOS TRABAJOS", 1880, 132, 92, "#ffffff", "right", "Lucky");
    const cols = [
      ["piloto", "PILOTO", "/piloto · 4 aeropuertos · 5 aviones", "#4fd8ff", [0.55, 0.45, 1.25]],
      ["ladron", "LADRÓN", "/robar · /palanca · /volarcajero · /atracar", "#E8392F", [0.56, 0.5, 1.25]],
      ["traficante", "TRAFICANTE", "El Chino · 22:00 a 05:00 · /sembrar", "#9B59B6", [0.58, 0.6, 1.4]],
    ];
    cols.forEach(([k, t, s, col, f], i) => {
      const x = 12 + i * 636, w = i === 2 ? 1908 - x : 624;
      panel(c, img[k], x, 194, w, 874, f);
      label(c, t, x + 24, 930, 56, "left", col, s);
    });
    save(cv, "trabajos");
  }

  // ---------------- 3. facciones ----------------
  {
    const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext("2d");
    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    panel(c, img.facciones, 12, 12, 1220, 1056, [0.62, 0.55, 1.05]);
    panel(c, img.saem, 1244, 12, 664, 520, [0.5, 0.55, 1.2]);
    sunsetBox(c, 1244, 544, 664, 524);
    drawLogo(c, 1576, 640, 420);
    const facs = [["LSPD", "#2A77A1"], ["SHERIFF", "#B87333"], ["FBI", "#3B4E78"], ["SAEM", "#8E8C46"], ["CITYTV", "#E8392F"], ["GOBIERNO", "#3C8DFF"]];
    facs.forEach(([n, col], i) => label(c, n, 1276 + (i % 2) * 318, 760 + Math.floor(i / 2) * 96, 40, "left", col));
    bigText(c, "FACCIONES", 40, 110, 110, "#ffffff", "left", "Lucky");
    label(c, "/garaje: los vehículos de cada facción", 40, 990, 38, "left", "#F59D99");
    label(c, "ÁREA 51", 1886, 30, 34, "right", "#8E8C46");
    save(cv, "facciones");
  }

  // ---------------- 4. cartel SAMPCITY ----------------
  {
    const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext("2d");
    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    panel(c, img.cartel, 12, 12, 1896, 1056, [0.5, 0.5, 1.0]);
    drawLogo(c, 330, 120, 520);
    label(c, "LA COLINA AHORA DICE SAMPCITY", 1886, 960, 50, "right", "#E8392F", "Las letras de Vinewood, en 3D y en su sitio");
    save(cv, "cartel");
  }

  // ---------------- 5. gracias a la comunidad ----------------
  {
    const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext("2d");
    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    sunsetBox(c, 12, 12, 1896, 760);
    drawLogo(c, 960, 110, 520);
    bigText(c, "¡GRACIAS, COMUNIDAD!", 960, 285, 104, "#ffffff", "center", "Lucky");
    bigText(c, "Esta actualización sale de sus reportes e ideas", 960, 345, 34, "#FFC9C4", "center", "PBlack");
    const col = (x, title, color, rows) => {
      label(c, title, x, 395, 40, "left", color);
      rows.forEach(([n, v], i) => label(c, `${n}  ·  ${v}`, x, 462 + i * 52, 28, "left", color));
    };
    col(70, "BUGS REPORTADOS", "#E8392F", [["RB4JUAN", 7], ["GleyberS.", 6], ["Kev", 5], ["Andy", 2], ["Unknown", 2], ["Manuel", 1]]);
    col(700, "IDEAS APROBADAS", "#F5B041", [["RB4JUAN", 11], ["John Wisky", 5], ["GleyberS.", 3], ["Andy", 2], ["Jorge_dgr", 2]]);
    col(1300, "MÁS IDEAS", "#9B59B6", [["Manuel", 2], ["dr_mendoza", 1], ["JUNIOR_LAKR4$", 1], ["Blaze.exe", 1], ["drok", 1]]);
    const strip = [["cartel", [0.5, 0.5, 1.3]], ["piloto", [0.55, 0.45, 1.2]], ["ladron", [0.56, 0.55, 1.2]], ["traficante", [0.58, 0.6, 1.3]]];
    strip.forEach(([k, f], i) => panel(c, img[k], 12 + i * 476, 784, i === 3 ? 1908 - (12 + i * 476) : 464, 284, f));
    save(cv, "gracias");
  }
})().catch((e) => { console.error(e); process.exit(1); });
