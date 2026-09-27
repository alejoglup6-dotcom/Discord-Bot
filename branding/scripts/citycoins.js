/*
 * Moneda CityCoins e imágenes de paquetes para Tebex (100 / 500 / 1000). Salida: branding/historial.
 * Uso (desde la raíz del repo): node branding/scripts/citycoins.js
 */
const path = require("path");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const F = path.join(__dirname, "../../src/assets/fonts") + "/";
const OUT = path.join(__dirname, "../historial");
GlobalFonts.registerFromPath(F + "Poppins-Bold.ttf", "PB");
GlobalFonts.registerFromPath(F + "Poppins-SemiBold.ttf", "PS");
const fs = require("fs");

function coin(c, cx, cy, R) {
  // Canto (grosor)
  c.save();
  c.shadowColor = "rgba(0,0,0,.45)"; c.shadowBlur = R * 0.12; c.shadowOffsetY = R * 0.05;
  c.fillStyle = "#8a5a00"; c.beginPath(); c.ellipse(cx, cy + R * 0.06, R, R, 0, 0, 7); c.fill();
  c.restore();
  // Borde exterior
  let g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  g.addColorStop(0, "#fff3b0"); g.addColorStop(0.35, "#ffc933"); g.addColorStop(0.7, "#e39b00"); g.addColorStop(1, "#b36d00");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  // Estrías del borde
  c.save(); c.strokeStyle = "rgba(120,70,0,.35)"; c.lineWidth = R * 0.012;
  for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); c.lineTo(cx + Math.cos(a) * R * 0.985, cy + Math.sin(a) * R * 0.985); c.stroke(); }
  c.restore();
  // Cara interior
  g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.05, cx, cy, R * 0.85);
  g.addColorStop(0, "#fff6c2"); g.addColorStop(0.45, "#ffd23f"); g.addColorStop(1, "#d98c00");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 0.86, 0, 7); c.fill();
  c.strokeStyle = "#a86400"; c.lineWidth = R * 0.03; c.beginPath(); c.arc(cx, cy, R * 0.78, 0, 7); c.stroke();
  c.strokeStyle = "rgba(255,248,200,.8)"; c.lineWidth = R * 0.012; c.beginPath(); c.arc(cx, cy, R * 0.755, 0, 7); c.stroke();

  // Ciudad (silueta grabada) dentro de un círculo
  c.save(); c.beginPath(); c.arc(cx, cy, R * 0.74, 0, 7); c.clip();
  const base = cy + R * 0.34;
  const b = [[-0.62,0.18,0.22],[-0.44,0.12,0.36],[-0.3,0.14,0.28],[-0.15,0.1,0.52],[-0.04,0.12,0.42],[0.1,0.11,0.62],[0.22,0.12,0.34],[0.35,0.13,0.46],[0.5,0.14,0.26]];
  c.fillStyle = "rgba(150,90,0,.55)";
  for (const [x, w, h] of b) c.fillRect(cx + x * R, base - h * R, w * R, h * R);
  // antena
  c.fillRect(cx + 0.15 * R, base - 0.74 * R, 0.012 * R, 0.13 * R);
  // palmeras
  for (const px of [-0.66, 0.62]) {
    c.strokeStyle = "rgba(150,90,0,.55)"; c.lineWidth = R * 0.025;
    c.beginPath(); c.moveTo(cx + px * R, base); c.quadraticCurveTo(cx + (px + 0.03) * R, base - 0.2 * R, cx + (px + 0.01) * R, base - 0.34 * R); c.stroke();
    for (let a = 0; a < 5; a++) { const ang = -Math.PI / 2 + (a - 2) * 0.55; c.beginPath(); c.moveTo(cx + (px + 0.01) * R, base - 0.34 * R); c.quadraticCurveTo(cx + (px + 0.01 + Math.cos(ang) * 0.1) * R, base - (0.4 - Math.sin(ang) * -0.06) * R, cx + (px + 0.01 + Math.cos(ang) * 0.16) * R, base - (0.3 + Math.sin(-ang) * 0.05) * R); c.lineWidth = R * 0.018; c.stroke(); }
  }
  c.fillRect(cx - R, base, 2 * R, R * 0.03);
  c.restore();

  // Letra C en relieve
  c.save();
  c.font = `${R * 0.95}px PB`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillStyle = "rgba(110,60,0,.55)"; c.fillText("C", cx + R * 0.025, cy - R * 0.02 + R * 0.03);
  g = c.createLinearGradient(0, cy - R * 0.5, 0, cy + R * 0.4); g.addColorStop(0, "#fffbe0"); g.addColorStop(0.5, "#ffd84d"); g.addColorStop(1, "#e8a000");
  c.fillStyle = g; c.fillText("C", cx, cy - R * 0.02);
  c.lineWidth = R * 0.012; c.strokeStyle = "#a86400"; c.strokeText("C", cx, cy - R * 0.02);
  c.restore();

  // Texto curvo arriba
  c.save(); c.fillStyle = "#8a5200"; c.font = `${R * 0.1}px PB`; c.textAlign = "center"; c.textBaseline = "middle";
  const txt = "CITYCOINS"; const rr = R * 0.84; const span = 0.95;
  [...txt].forEach((ch, i) => { const a = -Math.PI / 2 - span / 2 + (span * i) / (txt.length - 1); c.save(); c.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); c.rotate(a + Math.PI / 2); c.fillText(ch, 0, 0); c.restore(); });
  // estrellas abajo
  for (const a of [Math.PI / 2 - 0.35, Math.PI / 2, Math.PI / 2 + 0.35]) star(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * 0.045, "#8a5200");
  c.restore();

  // Brillo
  c.save(); c.beginPath(); c.arc(cx, cy, R * 0.98, 0, 7); c.clip();
  g = c.createLinearGradient(cx - R, cy - R, cx + R * 0.2, cy + R * 0.2);
  g.addColorStop(0, "rgba(255,255,255,.45)"); g.addColorStop(0.45, "rgba(255,255,255,0)");
  c.fillStyle = g; c.fillRect(cx - R, cy - R, 2 * R, 2 * R); c.restore();
}
function star(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.fill(); }
function sparkle(c, x, y, r) { c.save(); c.fillStyle = "rgba(255,255,230,.95)"; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); }

// 1. Moneda sola, fondo transparente
{ const cv = createCanvas(1024, 1024), c = cv.getContext("2d"); coin(c, 512, 500, 440); sparkle(c, 250, 230, 60); sparkle(c, 800, 780, 35);
  fs.writeFileSync(OUT + "/citycoin.png", cv.toBuffer("image/png")); }

// 2. Imagen de paquete (fondo + montón + cantidad)
function pack(amount, n) {
  const W = 1024, cv = createCanvas(W, W), c = cv.getContext("2d");
  let g = c.createRadialGradient(W / 2, W * 0.42, 50, W / 2, W / 2, W * 0.75); g.addColorStop(0, "#3b2466"); g.addColorStop(1, "#120a24");
  c.fillStyle = g; c.fillRect(0, 0, W, W);
  g = c.createRadialGradient(W / 2, W * 0.45, 10, W / 2, W * 0.45, 420); g.addColorStop(0, "rgba(255,200,60,.45)"); g.addColorStop(1, "rgba(255,200,60,0)");
  c.fillStyle = g; c.fillRect(0, 0, W, W);
  const pos = [[0, 0, 270], [-230, 90, 170], [230, 90, 170], [-120, 190, 140], [130, 200, 130]].slice(0, n);
  for (const [dx, dy, r] of pos.slice(1).sort((a, b) => a[1] - b[1])) coin(c, W / 2 + dx, 440 + dy, r);
  coin(c, W / 2 + pos[0][0], 420, pos[0][2]);
  sparkle(c, 250, 200, 40); sparkle(c, 790, 250, 28); sparkle(c, 820, 620, 22);
  c.textAlign = "center"; c.font = "150px PB";
  g = c.createLinearGradient(0, 760, 0, 900); g.addColorStop(0, "#fff3b0"); g.addColorStop(1, "#ffb000");
  c.lineWidth = 16; c.strokeStyle = "#2a1600"; c.strokeText(amount.toLocaleString("es-ES"), W / 2, 890); c.fillStyle = g; c.fillText(amount.toLocaleString("es-ES"), W / 2, 890);
  c.font = "64px PS"; c.fillStyle = "#ffffff"; c.fillText("CityCoins", W / 2, 970);
  fs.writeFileSync(OUT + `/citycoins-${amount}.png`, cv.toBuffer("image/png"));
}
pack(100, 1); pack(500, 3); pack(1000, 5);
