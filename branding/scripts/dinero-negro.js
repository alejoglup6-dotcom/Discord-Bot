/*
 * Banner del sistema de dinero negro (fajos de hasta $100.000 y bolsa de hasta $500.000).
 * Uso (desde la raíz del repo): node branding/scripts/dinero-negro.js  ->  branding/marca/banner-dinero-negro-1920x1080.png
 * Fajos y bolsa dibujados a mano (no son capturas del juego), con el estilo GTA de la marca: contorno negro, volumen y trama.
 */
const path = require("path");
const fs = require("fs");
const { createCanvas, GlobalFonts, P, PAIRS, wordmark, wm } = require("./lib");
GlobalFonts.registerFromPath(path.join(__dirname, "../fonts/Poppins-ExtraBold.ttf"), "PXB");
const OUT = path.join(__dirname, "../marca");

const W = 1920, H = 1080;
const cv = createCanvas(W, H), c = cv.getContext("2d");
let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// ---------------- escena: callejón de noche, luz roja y verde ----------------
let g = c.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, "#06080a"); g.addColorStop(0.55, "#0f1a12"); g.addColorStop(1, "#2a0a0c");
c.fillStyle = g; c.fillRect(0, 0, W, H);
g = c.createRadialGradient(W * 0.72, H * 0.55, 40, W * 0.72, H * 0.55, 760); g.addColorStop(0, "rgba(90,220,120,.28)"); g.addColorStop(1, "rgba(90,220,120,0)");
c.fillStyle = g; c.fillRect(0, 0, W, H);
g = c.createRadialGradient(W * 0.1, H * 1.05, 40, W * 0.1, H * 1.05, 900); g.addColorStop(0, "rgba(232,57,47,.45)"); g.addColorStop(1, "rgba(232,57,47,0)");
c.fillStyle = g; c.fillRect(0, 0, W, H);
// billetes cayendo al fondo
for (let i = 0; i < 38; i++) {
  c.save(); c.translate(rnd() * W, rnd() * H); c.rotate(rnd() * Math.PI); const k = 0.4 + rnd() * 0.6; c.scale(k, k);
  c.globalAlpha = 0.12 + rnd() * 0.18; c.fillStyle = "#7fd08a"; c.fillRect(-60, -28, 120, 56); c.strokeStyle = "#0a2a12"; c.lineWidth = 4; c.strokeRect(-60, -28, 120, 56);
  c.beginPath(); c.arc(0, 0, 14, 0, 7); c.stroke(); c.restore();
}
c.globalAlpha = 1;
// rayos detrás del botín
c.save(); c.translate(W * 0.72, H * 0.6);
for (let i = 0; i < 20; i++) { c.rotate(Math.PI / 10); c.fillStyle = i % 2 ? "rgba(140,255,160,.05)" : "rgba(255,90,70,.04)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(1300, -110); c.lineTo(1300, 110); c.fill(); }
c.restore();

// ---------------- ayudas de dibujo ----------------
const OUTL = "#0a0202";
function poly(pts, fill, lw = 10) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = OUTL; c.lineJoin = "round"; c.stroke(); }
function halftone(clip, x0, y0, x1, y1, col) { c.save(); clip(); c.clip(); c.fillStyle = col; for (let y = y0; y < y1; y += 14) for (let x = x0 + ((y / 14) % 2) * 7; x < x1; x += 14) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } c.restore(); }

// Fajo isométrico: x,y = esquina frontal-inferior; w = largo, d = fondo, h = alto
function stack(x, y, w, d, h) {
  const dx = d * 0.87, dy = -d * 0.5;
  const A = [x, y], B = [x + w, y], Bt = [x + w, y - h], At = [x, y - h];
  const Ct = [x + w + dx, y - h + dy], Dt = [x + dx, y - h + dy], Cb = [x + w + dx, y + dy];
  // frente: canto de billetes
  let gr = c.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, "#9fdc8c"); gr.addColorStop(1, "#3f7f3a");
  poly([A, B, Bt, At], gr);
  c.save(); c.beginPath(); c.rect(x, y - h, w, h); c.clip(); c.strokeStyle = "rgba(20,60,20,.55)"; c.lineWidth = 2; for (let yy = y - h + 7; yy < y; yy += 7) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); } c.restore();
  // lateral
  gr = c.createLinearGradient(x + w, 0, x + w + dx, 0); gr.addColorStop(0, "#5e9e52"); gr.addColorStop(1, "#2c5a2a");
  poly([B, Cb, Ct, Bt], gr);
  // tapa: billete
  gr = c.createLinearGradient(x, y - h + dy, x + w, y - h); gr.addColorStop(0, "#d8f5b8"); gr.addColorStop(1, "#8fcf78");
  poly([At, Bt, Ct, Dt], gr);
  // dibujo del billete en la tapa (en perspectiva)
  const tp = (u, v) => [At[0] + (Bt[0] - At[0]) * u + (Dt[0] - At[0]) * v, At[1] + (Bt[1] - At[1]) * u + (Dt[1] - At[1]) * v];
  c.lineWidth = 3; c.strokeStyle = "rgba(20,70,20,.7)";
  c.beginPath(); [tp(0.06, 0.12), tp(0.94, 0.12), tp(0.94, 0.88), tp(0.06, 0.88)].forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.stroke();
  const [cx, cy] = tp(0.25, 0.5); c.beginPath(); c.ellipse(cx, cy, w * 0.09, d * 0.2, -0.45, 0, 7); c.stroke();
  const [sx, sy] = tp(0.78, 0.5); c.font = `${Math.round(d * 0.5)}px Russo`; c.fillStyle = "rgba(20,70,20,.75)"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", sx, sy);
  // faja de papel en el centro
  const u0 = 0.43, u1 = 0.57;
  const band = (pts, col) => poly(pts, col, 6);
  band([tp(u0, 0), tp(u1, 0), tp(u1, 1), tp(u0, 1)], "#e9dcb0");
  band([[x + w * u0, y - h], [x + w * u1, y - h], [x + w * u1, y], [x + w * u0, y]], "#cdbd88");
  // brillo
  c.save(); c.beginPath(); [At, Bt, Ct, Dt].forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.clip();
  const gl = c.createLinearGradient(0, Dt[1], 0, At[1]); gl.addColorStop(0, "rgba(255,255,255,.45)"); gl.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gl; c.fillRect(x, Dt[1], w + dx, h + 200); c.restore();
  halftone(() => { c.beginPath(); c.rect(x, y - h * 0.45, w, h * 0.45); }, x, y - h * 0.45, x + w, y, "rgba(10,40,10,.25)");
}

// Bolsa de dinero: cx = centro, by = base
function bag(cx, by, sc) {
  const S = (v) => v * sc;
  c.save();
  // sombra
  c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.ellipse(cx + S(30), by + S(10), S(230), S(40), 0, 0, 7); c.fill();
  // billetes asomando
  const bill = (x, y, r) => { c.save(); c.translate(x, y); c.rotate(r); const gr = c.createLinearGradient(0, -S(60), 0, S(60)); gr.addColorStop(0, "#c9f0a8"); gr.addColorStop(1, "#6fb45c"); poly([[-S(70), -S(38)], [S(70), -S(38)], [S(70), S(38)], [-S(70), S(38)]], gr, S(8)); c.strokeStyle = "rgba(20,70,20,.7)"; c.lineWidth = S(3); c.strokeRect(-S(58), -S(28), S(116), S(56)); c.font = `${Math.round(S(44))}px Russo`; c.fillStyle = "rgba(20,70,20,.8)"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", 0, S(2)); c.restore(); };
  bill(cx - S(70), by - S(470), -0.5); bill(cx + S(60), by - S(480), 0.45); bill(cx - S(5), by - S(500), 0.05);
  // cuerpo del saco
  const body = () => { c.beginPath(); c.moveTo(cx - S(95), by - S(360)); c.bezierCurveTo(cx - S(300), by - S(250), cx - S(290), by, cx - S(150), by); c.lineTo(cx + S(150), by); c.bezierCurveTo(cx + S(290), by, cx + S(300), by - S(250), cx + S(95), by - S(360)); c.closePath(); };
  let gr = c.createLinearGradient(cx - S(250), 0, cx + S(250), 0); gr.addColorStop(0, "#3d4a22"); gr.addColorStop(0.4, "#8a8f4a"); gr.addColorStop(1, "#2c3317");
  body(); c.fillStyle = gr; c.fill(); c.lineWidth = S(12); c.strokeStyle = OUTL; c.stroke();
  // costuras y parches
  c.save(); body(); c.clip();
  c.strokeStyle = "rgba(20,20,5,.5)"; c.lineWidth = S(4); c.setLineDash([S(14), S(10)]); c.beginPath(); c.moveTo(cx - S(210), by - S(40)); c.bezierCurveTo(cx - S(80), by - S(10), cx + S(80), by - S(10), cx + S(210), by - S(40)); c.stroke(); c.setLineDash([]);
  const gl = c.createLinearGradient(cx - S(200), 0, cx + S(40), 0); gl.addColorStop(0, "rgba(255,255,220,0)"); gl.addColorStop(0.6, "rgba(255,255,220,.28)"); gl.addColorStop(1, "rgba(255,255,220,0)"); c.fillStyle = gl; c.fillRect(cx - S(260), by - S(380), S(300), S(400));
  c.restore();
  halftone(body, cx - S(300), by - S(150), cx + S(300), by, "rgba(10,10,0,.28)");
  // "$" grande con el estilo de la marca
  c.font = `${Math.round(S(230))}px Russo`; c.textAlign = "center"; c.textBaseline = "middle";
  c.lineJoin = "round"; c.lineWidth = S(26); c.strokeStyle = OUTL; c.strokeText("$", cx + S(8), by - S(165));
  gr = c.createLinearGradient(0, by - S(270), 0, by - S(60)); gr.addColorStop(0, "#ff9a86"); gr.addColorStop(0.5, "#e8392f"); gr.addColorStop(1, "#9e150f");
  c.fillStyle = gr; c.fillText("$", cx + S(8), by - S(165));
  // cuello atado y boca
  gr = c.createLinearGradient(cx - S(110), 0, cx + S(110), 0); gr.addColorStop(0, "#4a5428"); gr.addColorStop(0.5, "#9aa058"); gr.addColorStop(1, "#3a431c");
  poly([[cx - S(95), by - S(360)], [cx + S(95), by - S(360)], [cx + S(150), by - S(440)], [cx - S(150), by - S(440)]], gr, S(12));
  poly([[cx - S(105), by - S(350)], [cx + S(105), by - S(350)], [cx + S(100), by - S(378)], [cx - S(100), by - S(378)]], "#c9a064", S(9));
  c.restore();
}

// ---------------- botín a la derecha ----------------
c.save(); c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.ellipse(W * 0.66, H * 0.86, 520, 70, 0, 0, 7); c.fill(); c.restore();
stack(980, 930, 330, 170, 120);
stack(1010, 810, 300, 150, 110);
stack(1330, 960, 300, 160, 115);
bag(1600, 900, 1.05);
stack(1180, 1010, 280, 140, 100);

// ---------------- textos ----------------
const title = wordmark([{ text: "dinero ", pal: P.silver }, { text: "negro", pal: P.red }], { size: 190, depth: 22 });
const tw = Math.min(900, title.width); c.drawImage(title, 60, 120, tw, (title.height * tw) / title.width);

const logo = wm(PAIRS.principal, { size: 120, depth: 14 }); const lw = 330; c.drawImage(logo, 70, 40, lw, (logo.height * lw) / logo.width);

// sello "NUEVO"
c.save(); c.translate(1090, 190); c.rotate(-0.14);
c.fillStyle = "#1c9b4a"; c.strokeStyle = OUTL; c.lineWidth = 10; c.beginPath(); c.roundRect(-110, -44, 220, 88, 18); c.fill(); c.stroke();
c.fillStyle = "#fff"; c.font = "58px Russo"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("NUEVO", 0, 4); c.restore();

c.font = "44px PXB"; c.fillStyle = "#f2f2f2"; c.textAlign = "left"; c.textBaseline = "alphabetic";
c.fillText("Lo ilegal se paga en fajos. Lávalo antes de que te atrapen.", 70, 400);

const chips = [
  ["💵", "Fajos de hasta $100.000"],
  ["✂️", "Divide y junta tus fajos"],
  ["👜", "Bolsa: hasta $500.000"],
  ["🧺", "Lava en 3 puntos con /lavar"],
  ["🚨", "La policía lo confisca"],
];
let y = 460;
for (const [ico, t] of chips) {
  c.save();
  const x = 70, w = 700, h = 78;
  c.fillStyle = "rgba(10,2,2,.72)"; c.strokeStyle = "#e8392f"; c.lineWidth = 4; c.beginPath(); c.roundRect(x, y, w, h, 16); c.fill(); c.stroke();
  c.fillStyle = "#e8392f"; c.beginPath(); c.roundRect(x, y, 14, h, [16, 0, 0, 16]); c.fill();
  c.font = "40px PXB"; c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(t, x + 40, y + h / 2 + 2);
  c.restore();
  y += 96;
}

fs.writeFileSync(path.join(OUT, "banner-dinero-negro-1920x1080.png"), cv.toBuffer("image/png"));
console.log("ok");
