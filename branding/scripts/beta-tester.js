/*
 * Banner del canal de beta testers (código, obligaciones, beneficios y confidencialidad).
 * Uso (desde la raíz del repo): node branding/scripts/beta-tester.js  ->  branding/marca/banner-beta-tester-1920x720.png
 */
const path = require("path");
const fs = require("fs");
const { createCanvas, GlobalFonts, P, PAIRS, wordmark, wm } = require("./lib");
GlobalFonts.registerFromPath(path.join(__dirname, "../fonts/Poppins-ExtraBold.ttf"), "PXB");
const OUT = path.join(__dirname, "../marca");

const W = 1920, H = 720;
const cv = createCanvas(W, H), c = cv.getContext("2d");
let s = 33; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// ---------------- escena: Los Santos de noche, con el atardecer al fondo ----------------
let g = c.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, "#0e030a"); g.addColorStop(0.5, "#3a0916"); g.addColorStop(0.8, "#a8301f"); g.addColorStop(1, "#f29a4a");
c.fillStyle = g; c.fillRect(0, 0, W, H);
for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,230,220,${0.15 + rnd() * 0.5})`; c.fillRect(rnd() * W, rnd() * H * 0.45, 2, 2); }
c.save(); c.translate(W * 0.62, H * 0.95);
for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? "rgba(255,210,150,.06)" : "rgba(255,120,90,.045)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -70); c.lineTo(W, 70); c.fill(); }
c.restore();
g = c.createRadialGradient(W * 0.62, H * 0.95, 10, W * 0.62, H * 0.95, 300); g.addColorStop(0, "#fff0c0"); g.addColorStop(0.5, "#ffa845"); g.addColorStop(1, "rgba(255,120,60,0)");
c.fillStyle = g; c.beginPath(); c.arc(W * 0.62, H * 0.95, 300, 0, 7); c.fill();
const city = (base, scale, col, win) => {
  let x = -20;
  while (x < W) {
    const w = 45 + rnd() * 80, h = scale * (0.3 + rnd() * 0.7);
    c.fillStyle = col; c.fillRect(x, base - h, w, h + 400);
    if (rnd() < 0.25) c.fillRect(x + w / 2 - 3, base - h - 40, 6, 40);
    if (win) { c.fillStyle = "rgba(255,190,110,.5)"; for (let y = base - h + 14; y < base - 8; y += 18) for (let xx = x + 9; xx < x + w - 9; xx += 15) if (rnd() < 0.3) c.fillRect(xx, y, 5, 8); }
    x += w + 6;
  }
};
city(H * 0.9, 200, "rgba(60,10,30,.85)", false);
city(H * 1.0, 150, "#12030a", true);
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
palm(W - 90, H, 460, -1); palm(W - 260, H, 300, -1);
g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.65); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.6)");
c.fillStyle = g; c.fillRect(0, 0, W, H);

// ---------------- helpers ----------------
const draw = (img, cx, cy, w) => { const h = img.height * w / img.width; c.drawImage(img, cx - w / 2, cy - h / 2, w, h); return h; };
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

// ---------------- escudo dorado del beta tester ----------------
function shieldPath(cx, cy, w, h) {
  c.beginPath();
  c.moveTo(cx, cy - h / 2);
  c.quadraticCurveTo(cx + w * 0.3, cy - h * 0.42, cx + w / 2, cy - h * 0.44);
  c.lineTo(cx + w / 2, cy + h * 0.02);
  c.quadraticCurveTo(cx + w * 0.46, cy + h * 0.34, cx, cy + h / 2);
  c.quadraticCurveTo(cx - w * 0.46, cy + h * 0.34, cx - w / 2, cy + h * 0.02);
  c.lineTo(cx - w / 2, cy - h * 0.44);
  c.quadraticCurveTo(cx - w * 0.3, cy - h * 0.42, cx, cy - h / 2);
  c.closePath();
}
{
  const cx = 300, cy = 350, w = 330, h = 400;
  // sombra y extrusión
  c.save(); c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 40; c.shadowOffsetY = 18;
  for (let i = 18; i >= 1; i--) { shieldPath(cx + i * 0.5, cy + i, w, h); c.fillStyle = i === 18 ? "#0a0202" : `rgb(${120 - i * 4},${70 - i * 3},0)`; c.fill(); }
  c.restore();
  shieldPath(cx, cy, w + 26, h + 30); c.fillStyle = "#0a0202"; c.fill();
  shieldPath(cx, cy, w, h);
  g = c.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
  g.addColorStop(0, "#fffbe0"); g.addColorStop(0.3, "#ffd84a"); g.addColorStop(0.55, "#e89a00"); g.addColorStop(0.75, "#ffe07a"); g.addColorStop(1, "#b56d00");
  c.fillStyle = g; c.fill();
  // cara interior roja (marca) con borde dorado
  shieldPath(cx, cy + 6, w * 0.78, h * 0.78); c.fillStyle = "#0a0202"; c.fill();
  shieldPath(cx, cy + 6, w * 0.72, h * 0.72);
  g = c.createLinearGradient(0, cy - h * 0.36, 0, cy + h * 0.36); g.addColorStop(0, "#ff9a86"); g.addColorStop(0.45, "#e8392f"); g.addColorStop(1, "#7a0f0a");
  c.fillStyle = g; c.fill();
  // brillo arriba
  c.save(); shieldPath(cx, cy, w, h); c.clip();
  g = c.createLinearGradient(0, cy - h / 2, 0, cy - h * 0.05); g.addColorStop(0, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g; c.fillRect(cx - w, cy - h / 2, w * 2, h * 0.45); c.restore();
  // "BT" en 3D dorado dentro
  const bt = wordmark([{ text: "BT", pal: P.gold }], { size: 300, depth: 18, spacing: -4 });
  draw(bt, cx, cy - 8, 200);
  // cinta "OFICIAL" abajo
  c.save(); c.translate(cx, cy + h * 0.47);
  c.fillStyle = "#0a0202"; c.beginPath(); c.roundRect(-150, -30, 300, 60, 10); c.fill();
  g = c.createLinearGradient(0, -24, 0, 24); g.addColorStop(0, "#f59d99"); g.addColorStop(1, "#c65856");
  c.fillStyle = g; c.beginPath(); c.roundRect(-142, -22, 284, 44, 8); c.fill();
  c.font = "32px Russo"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round"; c.lineWidth = 7; c.strokeStyle = "#0a0202";
  c.strokeText("OFICIAL", 0, 2); c.fillStyle = "#fff"; c.fillText("OFICIAL", 0, 2);
  c.restore();
  sparkle(cx + 150, cy - 170, 30); sparkle(cx - 160, cy + 40, 16);
}

// ---------------- textos ----------------
const TX = 1120;
draw(wm(PAIRS.principal), TX, 110, 520);
draw(wordmark([{ text: "beta ", pal: P.white }, { text: "tester", pal: P.gold }], { size: 300, depth: 28 }), TX, 300, 1080);
sparkle(1610, 225, 36);
outlined("CÓDIGO Y COMPROMISO", TX, 452, 70, "PBlack", "#ffffff", { spacing: 3 });
outlined("Lo que debes saber antes de probar el servidor", TX, 516, 34, "PXB", "#ffd9c9", { stroke: 0.2 });

// etiquetas
const chips = [["OBLIGACIONES", "#f59d99", "#c65856"], ["BENEFICIOS", "#ffe07a", "#b56d00"], ["CONFIDENCIALIDAD", "#f24b3a", "#9e150f"]];
c.font = "30px Russo";
const pad = 30, gap = 22, widths = chips.map(([t]) => c.measureText(t).width + pad * 2);
let x = TX - (widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1)) / 2;
chips.forEach(([t, a, b], i) => {
  const w = widths[i], y = 575, h = 60;
  c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 16; c.shadowOffsetY = 6;
  c.fillStyle = "#0a0202"; c.beginPath(); c.roundRect(x - 5, y - 5, w + 10, h + 10, 16); c.fill(); c.restore();
  g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, 12); c.fill();
  c.fillStyle = "rgba(255,255,255,.3)"; c.beginPath(); c.roundRect(x + 4, y + 4, w - 8, h * 0.4, 9); c.fill();
  c.font = "30px Russo"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
  c.lineWidth = 7; c.strokeStyle = "#0a0202"; c.strokeText(t, x + w / 2, y + h / 2 + 2); c.fillStyle = "#fff"; c.fillText(t, x + w / 2, y + h / 2 + 2);
  x += w + gap;
});

// ---------------- sello "CONFIDENCIAL" ----------------
c.save(); c.translate(1690, 120); c.rotate(-0.14);
c.globalAlpha = 0.92; c.font = "44px Russo"; c.textAlign = "center"; c.textBaseline = "middle";
const sw = c.measureText("CONFIDENCIAL").width / 2 + 40;
c.strokeStyle = "#ff3b30"; c.lineWidth = 8; c.beginPath(); c.roundRect(-sw, -50, sw * 2, 100, 14); c.stroke();
c.lineWidth = 3; c.beginPath(); c.roundRect(-sw + 13, -37, sw * 2 - 26, 74, 10); c.stroke();
c.fillStyle = "#ff3b30"; c.fillText("CONFIDENCIAL", 0, 3);
c.restore();

fs.writeFileSync(`${OUT}/banner-beta-tester-1920x720.png`, cv.toBuffer("image/png"));
console.log("banner-beta-tester-1920x720.png");
