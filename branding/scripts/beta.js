/*
 * Banner de la convocatoria de beta testers (fase beta abierta).
 * Uso (desde la raíz del repo): node branding/scripts/beta.js  ->  branding/marca/banner-beta-1920x1080.png
 */
const path = require("path");
const fs = require("fs");
const { createCanvas, GlobalFonts, P, PAIRS, wordmark, wm } = require("./lib");
GlobalFonts.registerFromPath(path.join(__dirname, "../fonts/Poppins-ExtraBold.ttf"), "PXB");
const OUT = path.join(__dirname, "../marca");

const W = 1920, H = 1080;
const cv = createCanvas(W, H), c = cv.getContext("2d");
let s = 21; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// ---------------- escena: atardecer de Los Santos ----------------
let g = c.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, "#14040e"); g.addColorStop(0.42, "#4a0c1c"); g.addColorStop(0.72, "#c93a2c"); g.addColorStop(1, "#ffb35c");
c.fillStyle = g; c.fillRect(0, 0, W, H);
// estrellas arriba
for (let i = 0; i < 140; i++) { c.fillStyle = `rgba(255,230,220,${0.15 + rnd() * 0.5})`; c.fillRect(rnd() * W, rnd() * H * 0.35, 2, 2); }
// rayos de sol
c.save(); c.translate(W / 2, H * 0.8);
for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? "rgba(255,210,150,.07)" : "rgba(255,120,90,.05)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -90); c.lineTo(W, 90); c.fill(); }
c.restore();
g = c.createRadialGradient(W / 2, H * 0.8, 20, W / 2, H * 0.8, 360); g.addColorStop(0, "#fff3c4"); g.addColorStop(0.5, "#ffb347"); g.addColorStop(1, "rgba(255,120,60,0)");
c.fillStyle = g; c.beginPath(); c.arc(W / 2, H * 0.8, 360, 0, 7); c.fill();
// dos planos de edificios con ventanas encendidas
const city = (base, scale, col, win) => {
  let x = -20;
  while (x < W) {
    const w = 50 + rnd() * 90, h = scale * (0.3 + rnd() * 0.7);
    c.fillStyle = col; c.fillRect(x, base - h, w, h + 400);
    if (rnd() < 0.25) c.fillRect(x + w / 2 - 3, base - h - 50, 6, 50);
    if (win) { c.fillStyle = "rgba(255,190,110,.5)"; for (let y = base - h + 16; y < base - 10; y += 20) for (let xx = x + 10; xx < x + w - 10; xx += 16) if (rnd() < 0.3) c.fillRect(xx, y, 6, 9); }
    x += w + 6;
  }
};
city(H * 0.86, 300, "rgba(60,10,30,.85)", false);
city(H * 0.95, 230, "#12030a", true);
// palmeras en silueta
const palm = (x, base, h, lean) => {
  c.save(); c.strokeStyle = c.fillStyle = "#0a0206"; c.lineCap = "round";
  const tx = x + lean * h * 0.14, ty = base - h;
  c.lineWidth = h * 0.045; c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x, base - h * 0.5, tx, ty); c.stroke();
  for (const a of [-2.7, -2.2, -1.6, -1.0, -0.45, 0, -3.1]) {
    const L = h * 0.45, ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.5 + L * 0.32, mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.55 - L * 0.1;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my - h * 0.03, ex, ey); c.quadraticCurveTo(mx, my + h * 0.05, tx, ty); c.fill();
  }
  c.restore();
};
palm(110, H, 560, 1); palm(290, H, 380, 1); palm(W - 130, H, 520, -1); palm(W - 320, H, 340, -1);
// viñeta
g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.62)");
c.fillStyle = g; c.fillRect(0, 0, W, H);

// ---------------- helpers ----------------
const draw = (img, cx, cy, w) => { const h = img.height * w / img.width; c.drawImage(img, cx - w / 2, cy - h / 2, w, h); return h; };
// texto con contorno negro grueso y sombra (estilo GTA)
function outlined(text, x, y, size, font, fill, { align = "center", stroke = 0.22, spacing = 0 } = {}) {
  c.save(); c.font = `${size}px ${font}`; c.textAlign = align; c.textBaseline = "middle"; c.lineJoin = "round"; c.letterSpacing = `${spacing}px`;
  c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = size * 0.25; c.shadowOffsetY = size * 0.08;
  c.lineWidth = size * stroke; c.strokeStyle = "#0a0202"; c.strokeText(text, x, y);
  c.shadowColor = "transparent"; c.fillStyle = fill; c.fillText(text, x, y); c.restore();
}
function sparkle(x, y, r) {
  c.save(); c.shadowColor = "#fff"; c.shadowBlur = r; c.fillStyle = "#fff"; c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill(); c.restore();
}

// ---------------- logo + "fase beta" ----------------
draw(wm(PAIRS.principal), W / 2, 205, 900);
const beta = wordmark([{ text: "fase ", pal: P.white }, { text: "beta", pal: P.gold }], { size: 300, depth: 30 });
draw(beta, W / 2, 468, 1060);
sparkle(1400, 345, 44); sparkle(520, 120, 30); sparkle(470, 560, 20);

// sello "ABIERTA" inclinado, como pegatina
c.save(); c.translate(1575, 560); c.rotate(-0.12); c.scale(0.88, 0.88);
c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = 24; c.shadowOffsetY = 10;
c.fillStyle = "#0a0202"; c.beginPath(); c.roundRect(-150, -46, 300, 92, 18); c.fill(); c.shadowColor = "transparent";
g = c.createLinearGradient(0, -38, 0, 38); g.addColorStop(0, "#7dffa6"); g.addColorStop(0.5, "#2fd36b"); g.addColorStop(1, "#128a3f");
c.fillStyle = g; c.beginPath(); c.roundRect(-140, -36, 280, 72, 12); c.fill();
c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.roundRect(-134, -32, 268, 26, 10); c.fill();
c.font = "54px Russo"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round"; c.lineWidth = 10; c.strokeStyle = "#0a0202"; c.strokeText("ABIERTA", 0, 4); c.fillStyle = "#fff"; c.fillText("ABIERTA", 0, 4);
c.restore();

// ---------------- llamada ----------------
outlined("¡BUSCAMOS BETA TESTERS!", W / 2, 660, 84, "PBlack", "#ffffff", { spacing: 2 });
outlined("Prueba el servidor antes que nadie y ayúdanos a darle forma", W / 2, 738, 38, "PXB", "#ffd9c9", { stroke: 0.2 });

// ---------------- lo que ya se puede probar ----------------
const chips = ["ANDROID Y PC", "INVENTARIO MODERNO", "TRABAJOS Y FACCIONES", "CASAS Y NEGOCIOS", "AUTOESCUELA"];
c.font = "27px Russo";
const pad = 26, gap = 18, widths = chips.map((t) => c.measureText(t).width + pad * 2);
let x = (W - widths.reduce((a, b) => a + b, 0) - gap * (chips.length - 1)) / 2;
chips.forEach((t, i) => {
  const w = widths[i], y = 802, h = 58;
  c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 16; c.shadowOffsetY = 6;
  c.fillStyle = "#0a0202"; c.beginPath(); c.roundRect(x - 5, y - 5, w + 10, h + 10, 16); c.fill(); c.restore();
  g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, i % 2 ? "#f24b3a" : "#f59d99"); g.addColorStop(1, i % 2 ? "#9e150f" : "#c65856");
  c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, 12); c.fill();
  c.fillStyle = "rgba(255,255,255,.28)"; c.beginPath(); c.roundRect(x + 4, y + 4, w - 8, h * 0.4, 9); c.fill();
  c.font = "27px Russo"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
  c.lineWidth = 7; c.strokeStyle = "#0a0202"; c.strokeText(t, x + w / 2, y + h / 2 + 2); c.fillStyle = "#fff"; c.fillText(t, x + w / 2, y + h / 2 + 2);
  x += w + gap;
});

// ---------------- barra inferior: invitación y plazas ----------------
const by = 930;
c.save(); c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 30;
c.fillStyle = "rgba(10,2,2,.82)"; c.beginPath(); c.roundRect(W / 2 - 560, by, 1120, 104, 24); c.fill(); c.restore();
c.lineWidth = 4; c.strokeStyle = "rgba(245,157,153,.7)"; c.beginPath(); c.roundRect(W / 2 - 560, by, 1120, 104, 24); c.stroke();
c.font = "34px PXB"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = "#f59d99"; c.fillText("ÚNETE:", W / 2 - 520, by + 52);
c.font = "46px Russo"; c.fillStyle = "#ffffff"; c.fillText("discord.gg/QU7YWerPfV", W / 2 - 385, by + 54);
c.textAlign = "right"; c.font = "30px PXB"; c.fillStyle = "#ffd84a"; c.fillText("PLAZAS LIMITADAS", W / 2 + 520, by + 52);

fs.writeFileSync(`${OUT}/banner-beta-1920x1080.png`, cv.toBuffer("image/png"));
console.log("banner-beta-1920x1080.png");
