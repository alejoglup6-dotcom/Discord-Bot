/*
 * Genera todo el kit de marca de sampcity en branding/marca (logos, íconos PNG, marcas de agua, banners, manual).
 * Uso (desde la raíz del repo): node branding/scripts/marca.js
 */
const path = require("path");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const D = path.join(__dirname, "../fonts"), OUT = path.join(__dirname, "../marca");
GlobalFonts.registerFromPath(D + "/RussoOne-Regular.ttf", "Russo");
GlobalFonts.registerFromPath(D + "/Poppins-Black.ttf", "PBlack");
GlobalFonts.registerFromPath(path.join(__dirname, "../../src/assets/fonts/Poppins-SemiBold.ttf"), "PS");

// ---------------- Paletas ----------------
const P = {
  pink: { face: [[0, "#ffc9c4"], [0.4, "#f59d99"], [0.6, "#ec8784"], [1, "#c65856"]], ext: ["#c2605c", "#3a0a0a"], rim: "rgba(255,255,255,.75)" },
  red: { face: [[0, "#ff9a86"], [0.42, "#f24b3a"], [0.58, "#e8392f"], [1, "#9e150f"]], ext: ["#b3241c", "#3a0806"], rim: "rgba(255,200,190,.6)" },
  white: { face: [[0, "#ffffff"], [0.5, "#f1f1f5"], [1, "#c9c9d3"]], ext: ["#8e8e9a", "#26262c"], rim: "rgba(255,255,255,.9)" },
  silver: { face: [[0, "#ffffff"], [0.45, "#d7d9e2"], [0.55, "#9da1b3"], [1, "#e9ebf2"]], ext: ["#6c6f80", "#1e1f26"], rim: "rgba(255,255,255,.9)" },
  dark: { face: [[0, "#4a4a55"], [0.5, "#26262d"], [1, "#101014"]], ext: ["#000000", "#000000"], rim: "rgba(255,255,255,.18)" },
  gold: { face: [[0, "#fffbe0"], [0.35, "#ffd84a"], [0.55, "#e89a00"], [0.7, "#ffe07a"], [1, "#b56d00"]], ext: ["#a86400", "#2e1a00"], rim: "rgba(255,255,230,.8)" },
  neonPink: { face: [[0, "#ffe3f0"], [0.5, "#ff7ab6"], [1, "#d6247a"]], ext: ["#8a1150", "#20031a"], rim: "rgba(255,255,255,.8)" },
  neonBlue: { face: [[0, "#e0fbff"], [0.5, "#4fd8ff"], [1, "#1673d6"]], ext: ["#0d4f8a", "#03152b"], rim: "rgba(255,255,255,.8)" },
};
const PAIRS = {
  principal: [P.pink, P.red],
  blanco: [P.white, P.white],
  oscuro: [P.dark, P.dark],
  cromo_rojo: [P.silver, P.red],
  oro: [P.gold, P.red],
  neon: [P.neonPink, P.neonBlue],
};

function mix(a, b, t) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; }
function trim(cv) {
  const c = cv.getContext("2d"), { width: W, height: H } = cv, d = c.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 6) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const out = createCanvas(x1 - x0 + 1, y1 - y0 + 1); out.getContext("2d").drawImage(cv, -x0, -y0); return out;
}

/**
 * Logotipo: partes con su paleta, extrusión 3D, contorno, bisel, brillo y trama.
 * o.flat = sin 3D ni brillos (versión plana, como la referencia). o.outlineColor para versiones monocromas.
 */
function wordmark(parts, o = {}) {
  const { size = 300, depth = 26, dx = 0.55, dy = 1, outline = 0.2, skew = -0.06, spacing = -6, bold = 0.05, halftone = true, gloss = true, flat = false, outlineColor = "#0a0202", shadow = true, glow = null } = o;
  const d = flat ? 0 : depth;
  const pad = size * 0.9;
  const tmp = createCanvas(10, 10).getContext("2d"); tmp.font = `${size}px Russo`; tmp.letterSpacing = `${spacing}px`;
  const widths = parts.map((p) => tmp.measureText(p.text).width);
  const W = Math.ceil(widths.reduce((a, b) => a + b, 0) + pad * 2 + d * dx), H = Math.ceil(size * 1.5 + pad);
  const cv = createCanvas(W, H), c = cv.getContext("2d");
  const base = pad * 0.55 + size * 0.95;
  const xs = []; let x = pad; for (const w of widths) { xs.push(x); x += w; }
  const prep = (ctx) => { ctx.font = `${size}px Russo`; ctx.letterSpacing = `${spacing}px`; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round"; ctx.setTransform(1, 0, skew, 1, -skew * base, 0); };
  const each = (fn) => parts.forEach((p, i) => fn(p, xs[i]));

  if (glow) { c.save(); prep(c); c.shadowColor = glow; c.shadowBlur = size * 0.35; each((p, px) => { c.lineWidth = size * outline; c.strokeStyle = glow; c.strokeText(p.text, px + d * dx, base + d * dy); }); c.restore(); }
  if (shadow && !flat) { c.save(); prep(c); c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = size * 0.18; c.shadowOffsetY = size * 0.12; each((p, px) => { c.lineWidth = size * outline; c.strokeStyle = "#000"; c.strokeText(p.text, px + d * dx, base + d * dy); }); c.restore(); }
  c.save(); prep(c);
  for (let i = d; i >= 0; i--) each((p, px) => { c.lineWidth = size * outline; c.strokeStyle = outlineColor; c.strokeText(p.text, px + i * dx, base + i * dy); });
  for (let i = d; i >= 1; i--) { const t = i / d; each((p, px) => { c.fillStyle = mix(p.pal.ext[0], p.pal.ext[1], t); c.lineWidth = size * (bold + 0.05); c.strokeStyle = c.fillStyle; c.strokeText(p.text, px + i * dx, base + i * dy); c.fillText(p.text, px + i * dx, base + i * dy); }); }
  if (!flat) each((p, px) => { c.lineWidth = size * 0.075; c.strokeStyle = outlineColor; c.strokeText(p.text, px, base); });
  c.restore();
  each((p, px) => {
    const L = createCanvas(W, H), l = L.getContext("2d"); prep(l);
    const g = l.createLinearGradient(0, base - size * 0.78, 0, base + size * 0.05); for (const [of, col] of p.pal.face) g.addColorStop(of, col);
    l.fillStyle = g; l.strokeStyle = g; l.lineWidth = size * bold; l.strokeText(p.text, px, base); l.fillText(p.text, px, base);
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = "source-atop";
    if (gloss && !flat) { const gl = l.createLinearGradient(0, base - size * 0.8, 0, base - size * 0.42); gl.addColorStop(0, "rgba(255,255,255,.6)"); gl.addColorStop(1, "rgba(255,255,255,0)"); l.fillStyle = gl; l.fillRect(0, base - size * 0.8, W, size * 0.38); }
    if (halftone && !flat) for (let yy = base - size * 0.3; yy < base + size * 0.05; yy += size * 0.045) { const t = (yy - (base - size * 0.3)) / (size * 0.35); l.fillStyle = `rgba(40,0,0,${0.1 + t * 0.22})`; for (let xx = 0; xx < W; xx += size * 0.045) { l.beginPath(); l.arc(xx + ((yy / (size * 0.045)) % 2) * size * 0.022, yy, size * 0.009 * (0.6 + t), 0, 7); l.fill(); } }
    c.drawImage(L, 0, 0);
  });
  if (!flat) { c.save(); prep(c); each((p, px) => { c.lineWidth = size * 0.018; c.strokeStyle = p.pal.rim; c.strokeText(p.text, px, base); }); c.restore(); }
  return trim(cv);
}
const wm = (pair, o) => wordmark([{ text: "samp", pal: pair[0] }, { text: "city", pal: pair[1] }], o);
const icoLetters = (pair, o) => wordmark([{ text: "s", pal: pair[0] }, { text: "c", pal: pair[1] }], { size: 520, depth: 34, spacing: -10, ...o });

// ™ al lado del logo
function withTM(img, color = "#ffffff") {
  const s = img.height * 0.14;
  const cv = createCanvas(img.width + s * 1.8, img.height), c = cv.getContext("2d");
  c.drawImage(img, 0, 0);
  c.font = `${s}px Russo`; c.textBaseline = "top"; c.lineJoin = "round";
  c.lineWidth = s * 0.25; c.strokeStyle = "#0a0202"; c.strokeText("TM", img.width + s * 0.1, s * 0.4);
  c.fillStyle = color; c.fillText("TM", img.width + s * 0.1, s * 0.4);
  return cv;
}
// Versión apilada: samp arriba, city abajo
function stacked(pair, o = {}) {
  const a = wordmark([{ text: "samp", pal: pair[0] }], { size: 300, ...o }), b = wordmark([{ text: "city", pal: pair[1] }], { size: 300, ...o });
  const W = Math.max(a.width, b.width), H = a.height + b.height - 95;
  const cv = createCanvas(W, H), c = cv.getContext("2d");
  c.drawImage(b, (W - b.width) / 2, a.height - 95); c.drawImage(a, (W - a.width) / 2, 0);
  return cv;
}
function save(name, cv) { fs.writeFileSync(`${OUT}/${name}.png`, cv.toBuffer("image/png")); }
function onBg(img, bg, padX = 120, padY = 100) { const cv = createCanvas(img.width + padX * 2, img.height + padY * 2), c = cv.getContext("2d"); c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(img, padX, padY); return cv; }
function scaleTo(img, w) { const h = Math.round(img.height * w / img.width), cv = createCanvas(w, h); cv.getContext("2d").drawImage(img, 0, 0, w, h); return cv; }

// ---------------- 1. Logotipos ----------------
const L = {};
for (const [k, pair] of Object.entries(PAIRS)) L[k] = wm(pair, k === "neon" ? { glow: "rgba(255,80,200,.55)" } : k === "oscuro" ? { outlineColor: "#000", shadow: false } : {});
L.plano = wm(PAIRS.principal, { flat: true, outline: 0.16 });
L.apilado = stacked(PAIRS.principal);
for (const [k, img] of Object.entries(L)) save(`logo-${k}`, img);
save("logo-principal-TM", withTM(L.principal));

// ---------------- 2. Íconos PNG ----------------
function iconSquare(S, pair = PAIRS.principal) {
  const cv = createCanvas(S, S), c = cv.getContext("2d"), k = S / 1024;
  c.save(); c.beginPath(); c.roundRect(24 * k, 24 * k, S - 48 * k, S - 48 * k, 190 * k); c.clip();
  let g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#2a0710"); g.addColorStop(0.6, "#6b1020"); g.addColorStop(1, "#e0452f");
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  c.save(); c.translate(S / 2, S * 0.95); for (let i = 0; i < 20; i++) { c.rotate(Math.PI / 10); c.fillStyle = i % 2 ? "rgba(255,210,150,.08)" : "rgba(0,0,0,.08)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(S * 1.4, -90 * k); c.lineTo(S * 1.4, 90 * k); c.fill(); } c.restore();
  g = c.createRadialGradient(S / 2, S * 0.95, 10 * k, S / 2, S * 0.95, 380 * k); g.addColorStop(0, "rgba(255,230,160,.9)"); g.addColorStop(1, "rgba(255,120,60,0)"); c.fillStyle = g; c.fillRect(0, 0, S, S);
  c.restore();
  c.lineWidth = 26 * k; c.strokeStyle = "#0a0202"; c.beginPath(); c.roundRect(24 * k, 24 * k, S - 48 * k, S - 48 * k, 190 * k); c.stroke();
  c.lineWidth = 10 * k; c.strokeStyle = "#e8392f"; c.beginPath(); c.roundRect(44 * k, 44 * k, S - 88 * k, S - 88 * k, 172 * k); c.stroke();
  const w = S * 0.8, h = SC.height * w / SC.width; c.drawImage(SC, (S - w) / 2, (S - h) / 2, w, h);
  return cv;
}
function iconCircle(S) {
  const cv = createCanvas(S, S), c = cv.getContext("2d"), k = S / 1024;
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 6 * k, 0, 7); c.clip();
  let g = c.createRadialGradient(S / 2, S * 0.9, 10, S / 2, S / 2, S * 0.7); g.addColorStop(0, "#ff8a4a"); g.addColorStop(0.45, "#8a1426"); g.addColorStop(1, "#1e050c");
  c.fillStyle = g; c.fillRect(0, 0, S, S); c.restore();
  c.lineWidth = 22 * k; c.strokeStyle = "#0a0202"; c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 14 * k, 0, 7); c.stroke();
  c.lineWidth = 9 * k; c.strokeStyle = "#e8392f"; c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 30 * k, 0, 7); c.stroke();
  const w = S * 0.74, h = SC.height * w / SC.width; c.drawImage(SC, (S - w) / 2, (S - h) / 2, w, h);
  return cv;
}
const SC = icoLetters(PAIRS.principal);
const ICON_SIZES = [1024, 512, 256, 128, 64, 48, 32, 16];
for (const s of ICON_SIZES) { save(`icono-cuadrado-${s}`, iconSquare(s)); save(`icono-circular-${s}`, iconCircle(s)); }
save("icono-letras-transparente", SC);
save("icono-letras-blanco", icoLetters(PAIRS.blanco));

// ---------------- 3. Marcas de agua ----------------
function alpha(img, a) { const cv = createCanvas(img.width, img.height), c = cv.getContext("2d"); c.globalAlpha = a; c.drawImage(img, 0, 0); return cv; }
const WHITE_FLAT = wordmark([{ text: "samp", pal: P.white }, { text: "city", pal: P.white }], { flat: true, outline: 0.1, outlineColor: "#000000" });
const WM_W = alpha(scaleTo(WHITE_FLAT, 800), 0.4);
const WM_D = alpha(scaleTo(wordmark([{ text: "samp", pal: P.dark }, { text: "city", pal: P.dark }], { flat: true, outline: 0.1, outlineColor: "#ffffff" }), 800), 0.35);
save("marca-de-agua-blanca", WM_W);
save("marca-de-agua-oscura", WM_D);
save("marca-de-agua-color", alpha(scaleTo(L.plano, 800), 0.5));
// patrón diagonal repetido (para proteger capturas y diseños)
function pattern(W = 1920, H = 1080) {
  const cv = createCanvas(W, H), c = cv.getContext("2d"), m = scaleTo(WHITE_FLAT, 360);
  c.globalAlpha = 0.12; c.translate(W / 2, H / 2); c.rotate(-Math.PI / 9);
  for (let y = -H; y < H; y += 190) for (let x = -W * 1.1 + ((y / 190) % 2) * 230; x < W * 1.1; x += 460) c.drawImage(m, x, y);
  return cv;
}
save("marca-de-agua-patron-1920x1080", pattern());
// ejemplo aplicado sobre una captura (escena de prueba)
function sampleScene() {
  const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext("2d");
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3e6fa8"); g.addColorStop(0.6, "#e7a26b"); g.addColorStop(1, "#6b4a3a"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  let s = 5; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let x = 0; x < W; x += 70 + r() * 60) { const h = 200 + r() * 420; c.fillStyle = `rgba(40,35,50,${0.6 + r() * 0.3})`; c.fillRect(x, H * 0.72 - h, 60 + r() * 60, h + 400); }
  c.fillStyle = "#2b2b30"; c.fillRect(0, H * 0.78, W, H); c.fillStyle = "#e9d27a"; for (let x = 0; x < W; x += 160) c.fillRect(x, H * 0.88, 90, 12);
  c.font = "34px PS"; c.fillStyle = "rgba(255,255,255,.8)"; c.fillText("(captura de ejemplo)", 40, 60);
  return cv;
}
{ const sc = sampleScene(), c = sc.getContext("2d"); const m = scaleTo(WM_W, 420); c.drawImage(m, sc.width - m.width - 40, sc.height - m.height - 36); save("ejemplo-marca-de-agua-esquina", sc); }
{ const sc = sampleScene(), c = sc.getContext("2d"); c.drawImage(pattern(), 0, 0); save("ejemplo-marca-de-agua-patron", sc); }

// ---------------- 4. Banner (sin "roleplay") ----------------
function banner(W = 1920, H = 1080, logo = L.principal) {
  const cv = createCanvas(W, H), c = cv.getContext("2d");
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1a0612"); g.addColorStop(0.45, "#5a0f1f"); g.addColorStop(0.75, "#d9442f"); g.addColorStop(1, "#ffb35c"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, H * 0.78); for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? "rgba(255,210,150,.07)" : "rgba(255,120,90,.05)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -80); c.lineTo(W, 80); c.fill(); } c.restore();
  g = c.createRadialGradient(W / 2, H * 0.78, 20, W / 2, H * 0.78, 330); g.addColorStop(0, "#fff3c4"); g.addColorStop(0.5, "#ffb347"); g.addColorStop(1, "rgba(255,120,60,0)"); c.fillStyle = g; c.beginPath(); c.arc(W / 2, H * 0.78, 330, 0, 7); c.fill();
  const city = (base, scale, col, seed, win) => { let x = -20, s = seed; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); while (x < W) { const w = 50 + r() * 90, h = scale * (0.3 + r() * 0.7); c.fillStyle = col; c.fillRect(x, base - h, w, h + 400); if (r() < 0.25) c.fillRect(x + w / 2 - 3, base - h - 50, 6, 50); if (win) { c.fillStyle = "rgba(255,190,110,.5)"; for (let y = base - h + 16; y < base - 10; y += 20) for (let xx = x + 10; xx < x + w - 10; xx += 16) if (r() < 0.3) c.fillRect(xx, y, 6, 9); } x += w + 6; } };
  city(H * 0.83, 330, "rgba(60,10,30,.85)", 7, false); city(H * 0.93, 260, "#12030a", 3, true);
  const palm = (x, base, h, lean) => { c.save(); c.strokeStyle = c.fillStyle = "#0a0206"; c.lineCap = "round"; const tx = x + lean * h * 0.14, ty = base - h; c.lineWidth = h * 0.045; c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x, base - h * 0.5, tx, ty); c.stroke(); for (const a of [-2.7, -2.2, -1.6, -1.0, -0.45, 0, -3.1]) { const Lh = h * 0.45, ex = tx + Math.cos(a) * Lh, ey = ty + Math.sin(a) * Lh * 0.5 + Lh * 0.32, mx = tx + Math.cos(a) * Lh * 0.55, my = ty + Math.sin(a) * Lh * 0.55 - Lh * 0.1; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my - h * 0.03, ex, ey); c.quadraticCurveTo(mx, my + h * 0.05, tx, ty); c.fill(); } c.restore(); };
  palm(150, H, 520, 1); palm(W - 170, H, 460, -1); palm(330, H, 360, 1);
  g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.6)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const lw = W * 0.7, lh = logo.height * lw / logo.width; c.drawImage(logo, (W - lw) / 2, H * 0.36 - lh / 2, lw, lh);
  return cv;
}
save("banner-1920x1080", banner());
save("banner-discord-960x540", banner(960, 540));

// ---------------- 4b. Moneda CityCoins ----------------
// Pedido del dueño: moneda completamente dorada, solo con las siglas "CC" (CityCoins) en relieve (Russo One), también doradas.
const GOLD_SC = { face: [[0, "#fff8d0"], [0.3, "#ffe07a"], [0.55, "#f2b21c"], [0.75, "#ffd84a"], [1, "#b87400"]], ext: ["#b07000", "#4a2a00"], rim: "rgba(255,250,215,.9)" };
function coin(S = 1024) {
  const cv = createCanvas(S, S), c = cv.getContext("2d"), k = S / 1024, cx = S / 2, cy = S / 2, R = 460 * k;
  const lin = (x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
  const GOLD = [[0, "#fff6c2"], [0.28, "#ffd23f"], [0.55, "#e39b00"], [0.78, "#ffe07a"], [1, "#a86400"]];
  // sombra y canto (grosor de la moneda)
  c.save(); c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = 40 * k; c.shadowOffsetY = 24 * k;
  c.fillStyle = "#8a5400"; c.beginPath(); c.arc(cx, cy + 28 * k, R, 0, 7); c.fill(); c.restore();
  for (let i = 28; i >= 0; i -= 2) { c.fillStyle = mix("#c98a10", "#6b3d00", i / 28); c.beginPath(); c.arc(cx, cy + i * k, R, 0, 7); c.fill(); }
  // borde exterior con estrías
  c.fillStyle = lin(0, 0, S, S, GOLD); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  c.strokeStyle = "rgba(120,70,0,.35)"; c.lineWidth = 5 * k;
  for (let i = 0; i < 150; i++) { const a = (i / 150) * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.91, cy + Math.sin(a) * R * 0.91); c.lineTo(cx + Math.cos(a) * R * 0.99, cy + Math.sin(a) * R * 0.99); c.stroke(); }
  // escalón hacia la cara: sombra arriba-izquierda y luz abajo-derecha (la cara queda hundida)
  c.lineWidth = 16 * k; c.strokeStyle = lin(cx - R, cy - R, cx + R, cy + R, [[0, "#7a4600"], [0.5, "#c98a10"], [1, "#fff1a8"]]);
  c.beginPath(); c.arc(cx, cy, R * 0.86, 0, 7); c.stroke();
  // cara
  let g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.05, cx, cy, R * 0.85);
  g.addColorStop(0, "#fff3b8"); g.addColorStop(0.45, "#ffd23f"); g.addColorStop(1, "#d99200");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 0.84, 0, 7); c.fill();
  // anillo fino decorativo
  c.lineWidth = 6 * k; c.strokeStyle = "rgba(150,90,0,.55)"; c.beginPath(); c.arc(cx, cy, R * 0.76, 0, 7); c.stroke();
  c.lineWidth = 3 * k; c.strokeStyle = "rgba(255,248,210,.8)"; c.beginPath(); c.arc(cx, cy, R * 0.745, 0, 7); c.stroke();
  // siglas SC en relieve, doradas
  const sc = wordmark([{ text: "CC", pal: GOLD_SC }], { size: 420, depth: 22, dx: 0.45, dy: 1, outline: 0.1, outlineColor: "#5a3300", skew: 0, spacing: -8, halftone: false, shadow: false });
  const w = R * 1.18, h = sc.height * w / sc.width;
  // sombra: silueta de las letras teñida y desenfocada (con shadowBlur salía un recuadro)
  // con margen alrededor: si no, el desenfoque se corta en los bordes de la imagen y deja un recuadro
  const m = 80, sh = createCanvas(sc.width + m * 2, sc.height + m * 2), shc = sh.getContext("2d");
  shc.drawImage(sc, m, m); shc.globalCompositeOperation = "source-in"; shc.fillStyle = "rgba(90,50,0,.6)"; shc.fillRect(0, 0, sh.width, sh.height);
  const sk = w / sc.width;
  c.save(); c.filter = `blur(${14 * k}px)`; c.drawImage(sh, cx - w / 2 - m * sk + 6 * k, cy - h / 2 - m * sk + 10 * k, sh.width * sk, sh.height * sk); c.restore();
  c.drawImage(sc, cx - w / 2, cy - h / 2 - 6 * k, w, h);
  // brillo general
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
  g = c.createLinearGradient(cx - R, cy - R, cx + R * 0.3, cy + R * 0.3); g.addColorStop(0, "rgba(255,255,255,.4)"); g.addColorStop(0.45, "rgba(255,255,255,0)");
  c.fillStyle = g; c.fillRect(0, 0, S, S); c.restore();
  return cv;
}
const COIN = coin(1024);
save("citycoin", COIN);
save("citycoin-128", scaleTo(COIN, 128));
function coinPack(amount, n) {
  const W = 1024, cv = createCanvas(W, W), c = cv.getContext("2d");
  let g = c.createLinearGradient(0, 0, 0, W); g.addColorStop(0, "#1a0612"); g.addColorStop(0.6, "#5a0f1f"); g.addColorStop(1, "#d9442f"); c.fillStyle = g; c.fillRect(0, 0, W, W);
  c.save(); c.translate(W / 2, W * 0.45); for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? "rgba(255,210,150,.08)" : "rgba(0,0,0,.08)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, -70); c.lineTo(W, 70); c.fill(); } c.restore();
  g = c.createRadialGradient(W / 2, W * 0.45, 10, W / 2, W * 0.45, 420); g.addColorStop(0, "rgba(255,210,120,.55)"); g.addColorStop(1, "rgba(255,120,60,0)"); c.fillStyle = g; c.fillRect(0, 0, W, W);
  const pos = [[0, 0, 300], [-250, 110, 190], [250, 110, 190], [-140, 210, 160], [150, 220, 150]].slice(0, n);
  for (const [dx, dy, r] of pos.slice(1).sort((a, b) => a[1] - b[1])) c.drawImage(COIN, W / 2 + dx - r, 400 + dy - r, r * 2, r * 2);
  c.drawImage(COIN, W / 2 - 300, 400 - 300, 600, 600);
  const num = wordmark([{ text: amount.toLocaleString("es-ES"), pal: P.gold }], { size: 260, depth: 20 });
  const nw = Math.min(W * 0.8, num.width * 0.62), nh = num.height * nw / num.width; c.drawImage(num, (W - nw) / 2, 760 - nh / 2 + 10, nw, nh);
  const lab = wordmark([{ text: "citycoins", pal: P.white }], { size: 200, depth: 10, halftone: false });
  const lw = 420, lh = lab.height * lw / lab.width; c.drawImage(lab, (W - lw) / 2, 900, lw, lh);
  return cv;
}
for (const [a, n] of [[100, 1], [500, 3], [1000, 5]]) save(`citycoins-${a}`, coinPack(a, n));

// ---------------- 4c. Emojis (128 px) ----------------
save("emoji-sc", scaleTo(SC, 128));
save("emoji-citycoin", scaleTo(COIN, 128));
save("emoji-samp", scaleTo(wordmark([{ text: "samp", pal: P.pink }], { size: 300, depth: 14 }), 128));
save("emoji-city", scaleTo(wordmark([{ text: "city", pal: P.red }], { size: 300, depth: 14 }), 128));

// ---------------- 4d. Foto de perfil del bot (circular) ----------------
// Discord recorta el avatar en círculo: todo el diseño vive dentro del círculo y se revisa a 40 px (chat).
function avatarBase(S, draw) {
  const cv = createCanvas(S, S), c = cv.getContext("2d"), k = S / 1024, cx = S / 2, cy = S / 2, R = 500 * k;
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip(); draw(c, k, cx, cy, R); c.restore();
  // aro: contorno negro + bisel rosa/rojo con brillo arriba
  c.lineWidth = 40 * k; c.strokeStyle = "#0a0202"; c.beginPath(); c.arc(cx, cy, R - 20 * k, 0, 7); c.stroke();
  const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#ffd0cb"); g.addColorStop(0.35, "#f59d99"); g.addColorStop(0.7, "#e8392f"); g.addColorStop(1, "#9e150f");
  c.lineWidth = 22 * k; c.strokeStyle = g; c.beginPath(); c.arc(cx, cy, R - 30 * k, 0, 7); c.stroke();
  c.lineWidth = 6 * k; c.strokeStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.arc(cx, cy, R - 36 * k, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.lineWidth = 6 * k; c.strokeStyle = "#0a0202"; c.beginPath(); c.arc(cx, cy, R - 44 * k, 0, 7); c.stroke();
  return cv;
}
function sunsetScene(c, k, S, { city = true } = {}) {
  let g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#1a0612"); g.addColorStop(0.5, "#5a0f1f"); g.addColorStop(0.8, "#d9442f"); g.addColorStop(1, "#ffb35c");
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  c.save(); c.translate(S / 2, S * 0.8); for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? "rgba(255,210,150,.09)" : "rgba(0,0,0,.07)"; c.beginPath(); c.moveTo(0, 0); c.lineTo(S, -60 * k); c.lineTo(S, 60 * k); c.fill(); } c.restore();
  g = c.createRadialGradient(S / 2, S * 0.8, 10 * k, S / 2, S * 0.8, 300 * k); g.addColorStop(0, "#fff3c4"); g.addColorStop(0.45, "#ffb347"); g.addColorStop(1, "rgba(255,120,60,0)");
  c.fillStyle = g; c.beginPath(); c.arc(S / 2, S * 0.8, 300 * k, 0, 7); c.fill();
  if (!city) return;
  let s = 11; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (const [base, sc, col, win] of [[S * 0.84, 230 * k, "rgba(70,12,30,.9)", false], [S * 0.93, 190 * k, "#12030a", true]]) {
    let x = 0; while (x < S) { const w = (45 + r() * 70) * k, h = sc * (0.35 + r() * 0.65); c.fillStyle = col; c.fillRect(x, base - h, w, h + S); if (win) { c.fillStyle = "rgba(255,190,110,.55)"; for (let y = base - h + 14 * k; y < base - 8 * k; y += 18 * k) for (let xx = x + 8 * k; xx < x + w - 10 * k; xx += 14 * k) if (r() < 0.3) c.fillRect(xx, y, 5 * k, 8 * k); } x += w + 5 * k; }
  }
  const palm = (x, base, h, lean) => { c.save(); c.strokeStyle = c.fillStyle = "#0a0206"; c.lineCap = "round"; const tx = x + lean * h * 0.14, ty = base - h; c.lineWidth = h * 0.05; c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x, base - h * 0.5, tx, ty); c.stroke(); for (const a of [-2.7, -2.2, -1.6, -1.0, -0.45, 0, -3.1]) { const Lh = h * 0.45, ex = tx + Math.cos(a) * Lh, ey = ty + Math.sin(a) * Lh * 0.5 + Lh * 0.32, mx = tx + Math.cos(a) * Lh * 0.55, my = ty + Math.sin(a) * Lh * 0.55 - Lh * 0.1; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my - h * 0.03, ex, ey); c.quadraticCurveTo(mx, my + h * 0.05, tx, ty); c.fill(); } c.restore(); };
  palm(150 * k, S, 380 * k, 1); palm(880 * k, S, 330 * k, -1);
}
function gloss(c, k, cx, cy, R) { const g = c.createLinearGradient(0, cy - R, 0, cy); g.addColorStop(0, "rgba(255,255,255,.22)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy - R * 0.45, R * 0.78, R * 0.42, 0, 0, 7); c.fill(); }
function glowSparkle(c, x, y, r) { c.save(); c.shadowColor = "#fff"; c.shadowBlur = r; c.fillStyle = "#fff"; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); }
// A: atardecer de Los Santos con el "sc"
const avatarA = (S = 1024) => avatarBase(S, (c, k, cx, cy, R) => {
  sunsetScene(c, k, S);
  const w = S * 0.64, h = SC.height * w / SC.width; c.drawImage(SC, cx - w / 2, cy * 0.9 - h / 2, w, h);
  gloss(c, k, cx, cy, R); glowSparkle(c, 270 * k, 270 * k, 36 * k);
});
// B: noche neón (estilo synthwave) con el "sc" brillando
const avatarB = (S = 1024) => avatarBase(S, (c, k, cx, cy, R) => {
  let g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#0b0410"); g.addColorStop(0.55, "#2a0718"); g.addColorStop(1, "#4a0b22"); c.fillStyle = g; c.fillRect(0, 0, S, S);
  // suelo con rejilla en perspectiva
  const hz = S * 0.7; c.strokeStyle = "rgba(255,80,140,.55)"; c.lineWidth = 3 * k;
  for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(cx + i * 20 * k, hz); c.lineTo(cx + i * 150 * k, S); c.stroke(); }
  for (let j = 0; j < 9; j++) { const y = hz + Math.pow(j / 8, 1.8) * (S - hz); c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke(); }
  // sol retro con franjas detrás
  c.save(); c.beginPath(); c.arc(cx, hz, 270 * k, Math.PI, 0); c.clip();
  g = c.createLinearGradient(0, hz - 270 * k, 0, hz); g.addColorStop(0, "#ffd36b"); g.addColorStop(0.5, "#ff7a59"); g.addColorStop(1, "#e8392f");
  c.fillStyle = g; c.fillRect(0, 0, S, S); c.fillStyle = "#2a0718"; for (let i = 0; i < 5; i++) c.fillRect(0, hz - 110 * k + i * 26 * k, S, (4 + i * 3) * k);
  c.restore();
  const w = S * 0.58, h = SC.height * w / SC.width, y = cy * 0.74 - h / 2;
  c.save(); c.shadowColor = "#ff2e6e"; c.shadowBlur = 90 * k; c.drawImage(SC, cx - w / 2, y, w, h); c.restore();
  c.drawImage(SC, cx - w / 2, y, w, h);
  gloss(c, k, cx, cy, R); glowSparkle(c, 760 * k, 260 * k, 32 * k);
});
// C: logotipo apilado "samp / city" sobre el atardecer
const STACK = stacked(PAIRS.principal);
const avatarC = (S = 1024) => avatarBase(S, (c, k, cx, cy, R) => {
  sunsetScene(c, k, S);
  const w = S * 0.6, h = STACK.height * w / STACK.width; c.drawImage(STACK, cx - w / 2, cy * 0.92 - h / 2, w, h);
  gloss(c, k, cx, cy, R);
});
const AV = { A: avatarA(), B: avatarB(), C: avatarC() };
for (const [k, img] of Object.entries(AV)) { save(`avatar-bot-${k}`, img); save(`avatar-bot-${k}-512`, scaleTo(img, 512)); }
// Vista previa: grande + en el chat de Discord (40 px) en tema oscuro y claro
{
  const W = 2100, H = 1150, cv = createCanvas(W, H), c = cv.getContext("2d");
  c.fillStyle = "#0e0e12"; c.fillRect(0, 0, W, H);
  c.font = "56px PBlack"; c.fillStyle = "#fff"; c.fillText("Foto de perfil del bot · 3 opciones", 60, 90);
  const names = { A: "A · Atardecer", B: "B · Neón nocturno", C: "C · samp / city" };
  Object.entries(AV).forEach(([k, img], i) => {
    const x = 60 + i * 680;
    c.save(); c.beginPath(); c.arc(x + 300, 440, 300, 0, 7); c.clip(); c.drawImage(img, x, 140, 600, 600); c.restore();
    c.font = "40px PBlack"; c.fillStyle = "#fff"; c.fillText(names[k], x, 800);
    for (const [j, bg, fg, sub] of [[0, "#313338", "#f2f3f5", "#b5bac1"], [1, "#ffffff", "#060607", "#5c5e66"]]) {
      const y = 840 + j * 145; c.fillStyle = bg; c.beginPath(); c.roundRect(x, y, 620, 125, 14); c.fill();
      c.save(); c.beginPath(); c.arc(x + 44, y + 44, 20, 0, 7); c.clip(); c.drawImage(scaleTo(img, 40), x + 24, y + 24); c.restore();
      c.font = "26px PS"; c.fillStyle = "#e8392f"; c.fillText("SampCity", x + 80, y + 45);
      const nx = x + 80 + c.measureText("SampCity").width + 10;
      c.fillStyle = "#5865f2"; c.beginPath(); c.roundRect(nx, y + 24, 56, 26, 5); c.fill(); c.font = "18px PS"; c.fillStyle = "#fff"; c.fillText("BOT", nx + 10, y + 44);
      c.font = "24px PS"; c.fillStyle = sub; c.fillText("¡Bienvenido/a a sampcity!", x + 80, y + 88);
    }
  });
  save("avatar-bot-opciones", cv);
}

// ---------------- 4e. Robot del bot (foto de perfil circular) ----------------
// Cabeza de robot con la estética de la marca: contorno negro grueso, extrusión 3D granate, bisel y brillo,
// visor con ojos LED rosa/rojo, antena y el "sc" en la frente; fondo de atardecer (A) o neón (B).
function robotHead(S, { accent = "red" } = {}) {
  const cv = createCanvas(S, S), c = cv.getContext("2d"), k = S / 1024;
  const cx = S / 2, hw = 560 * k, hh = 440 * k, hx = cx - hw / 2, hy = 330 * k, rad = 120 * k;
  const head = (x, y, grow = 0) => { c.beginPath(); c.roundRect(x - grow, y - grow, hw + grow * 2, hh + grow * 2, rad + grow); };
  const OUT = "#0a0202", depth = 30 * k;
  // orejas (detrás de la cabeza)
  for (const sgn of [-1, 1]) {
    const ex = sgn < 0 ? hx - 95 * k : hx + hw - 15 * k, ey = hy + 140 * k;
    for (let i = depth; i >= 0; i -= 2 * k) { c.fillStyle = i ? mix("#b3241c", "#3a0806", i / depth) : "#e8392f"; c.strokeStyle = OUT; c.lineWidth = 16 * k; c.beginPath(); c.roundRect(ex + i * 0.55, ey + i, 90 * k, 150 * k, 30 * k); if (!i) { c.stroke(); } c.fill(); }
    const g = c.createLinearGradient(0, ey, 0, ey + 150 * k); g.addColorStop(0, "#ff9a86"); g.addColorStop(1, "#9e150f"); c.fillStyle = g; c.beginPath(); c.roundRect(ex, ey, 90 * k, 150 * k, 30 * k); c.fill(); c.lineWidth = 12 * k; c.stroke();
    c.fillStyle = "#ffd0cb"; c.beginPath(); c.arc(ex + 45 * k, ey + 75 * k, 14 * k, 0, 7); c.fill(); c.lineWidth = 6 * k; c.stroke();
  }
  // antena
  c.lineCap = "round"; c.strokeStyle = OUT; c.lineWidth = 34 * k; c.beginPath(); c.moveTo(cx, hy + 10 * k); c.lineTo(cx, hy - 130 * k); c.stroke();
  c.strokeStyle = "#c9ccd8"; c.lineWidth = 16 * k; c.beginPath(); c.moveTo(cx, hy + 10 * k); c.lineTo(cx, hy - 130 * k); c.stroke();
  c.save(); c.shadowColor = "#ff2e6e"; c.shadowBlur = 60 * k; c.fillStyle = "#e8392f"; c.beginPath(); c.arc(cx, hy - 160 * k, 52 * k, 0, 7); c.fill(); c.restore();
  c.lineWidth = 14 * k; c.strokeStyle = OUT; c.beginPath(); c.arc(cx, hy - 160 * k, 52 * k, 0, 7); c.stroke();
  let g = c.createRadialGradient(cx - 18 * k, hy - 180 * k, 4 * k, cx, hy - 160 * k, 52 * k); g.addColorStop(0, "#ffe3dd"); g.addColorStop(0.5, "#f24b3a"); g.addColorStop(1, "#9e150f");
  c.fillStyle = g; c.beginPath(); c.arc(cx, hy - 160 * k, 45 * k, 0, 7); c.fill();
  // sombra, contorno y extrusión 3D de la cabeza
  c.save(); c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 50 * k; c.shadowOffsetY = 30 * k; c.fillStyle = OUT; head(hx + depth * 0.55, hy + depth, 20 * k); c.fill(); c.restore();
  for (let i = depth; i >= 0; i -= 2 * k) { c.fillStyle = OUT; head(hx + i * 0.55, hy + i, 20 * k); c.fill(); }
  for (let i = depth; i >= 1; i -= 2 * k) { c.fillStyle = mix("#6c6f80", "#1e1f26", i / depth); head(hx + i * 0.55, hy + i); c.fill(); }
  // cara metálica (cromo) con brillo arriba y trama de puntos abajo
  const L = createCanvas(S, S), l = L.getContext("2d");
  g = l.createLinearGradient(0, hy, 0, hy + hh); g.addColorStop(0, "#ffffff"); g.addColorStop(0.45, "#dfe2ec"); g.addColorStop(0.55, "#a7abbd"); g.addColorStop(1, "#e4e6ee");
  l.fillStyle = g; l.beginPath(); l.roundRect(hx, hy, hw, hh, rad); l.fill();
  l.globalCompositeOperation = "source-atop";
  for (let yy = hy + hh * 0.72; yy < hy + hh; yy += 18 * k) { const t = (yy - hy - hh * 0.72) / (hh * 0.28); l.fillStyle = `rgba(40,20,30,${0.08 + t * 0.2})`; for (let xx = hx; xx < hx + hw; xx += 18 * k) { l.beginPath(); l.arc(xx + ((yy / (18 * k)) % 2) * 9 * k, yy, 3.4 * k * (0.6 + t), 0, 7); l.fill(); } }
  c.drawImage(L, 0, 0);
  c.lineWidth = 8 * k; c.strokeStyle = "rgba(255,255,255,.8)"; c.beginPath(); c.roundRect(hx + 12 * k, hy + 12 * k, hw - 24 * k, hh - 24 * k, rad - 12 * k); c.stroke();
  // visor de cristal oscuro con ojos LED
  const vx = hx + 60 * k, vy = hy + 110 * k, vw = hw - 120 * k, vh = 170 * k;
  c.fillStyle = OUT; c.beginPath(); c.roundRect(vx - 14 * k, vy - 14 * k, vw + 28 * k, vh + 28 * k, 70 * k); c.fill();
  g = c.createLinearGradient(0, vy, 0, vy + vh); g.addColorStop(0, "#3a0a1c"); g.addColorStop(1, "#0d0308"); c.fillStyle = g; c.beginPath(); c.roundRect(vx, vy, vw, vh, 60 * k); c.fill();
  for (const ex of [vx + vw * 0.28, vx + vw * 0.72]) {
    c.save(); c.shadowColor = accent === "red" ? "#ff2e6e" : "#4fd8ff"; c.shadowBlur = 55 * k;
    g = c.createLinearGradient(0, vy + 40 * k, 0, vy + vh - 40 * k); g.addColorStop(0, "#ffe3dd"); g.addColorStop(0.5, "#ff7a86"); g.addColorStop(1, "#e8392f");
    c.fillStyle = g; c.beginPath(); c.roundRect(ex - 62 * k, vy + 45 * k, 124 * k, vh - 90 * k, 40 * k); c.fill(); c.restore();
  }
  c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.moveTo(vx + 40 * k, vy + 12 * k); c.lineTo(vx + 170 * k, vy + 12 * k); c.lineTo(vx + 110 * k, vy + vh - 12 * k); c.lineTo(vx + 10 * k, vy + vh - 12 * k); c.closePath(); c.fill();
  // boca: rejilla
  const mx = cx - 150 * k, my = hy + 320 * k, mw = 300 * k, mh = 64 * k;
  c.fillStyle = OUT; c.beginPath(); c.roundRect(mx - 10 * k, my - 10 * k, mw + 20 * k, mh + 20 * k, 26 * k); c.fill();
  c.fillStyle = "#2a0718"; c.beginPath(); c.roundRect(mx, my, mw, mh, 20 * k); c.fill();
  for (let i = 1; i < 6; i++) { const x = mx + (mw / 6) * i; c.fillStyle = i % 2 ? "#e8392f" : "#f59d99"; c.fillRect(x - 5 * k, my + 10 * k, 10 * k, mh - 20 * k); }
  // "sc" en la frente
  const w = 170 * k, h = SC.height * w / SC.width; c.drawImage(SC, cx - w / 2, hy + 14 * k, w, h);
  return cv;
}
const ROBOT = robotHead(1024);
const robotAvatar = (bgNeon) => avatarBase(1024, (c, k, cx, cy, R) => {
  if (bgNeon) {
    let g = c.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, "#0b0410"); g.addColorStop(0.55, "#2a0718"); g.addColorStop(1, "#4a0b22"); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
    const hz = 1024 * 0.72; c.strokeStyle = "rgba(255,80,140,.5)"; c.lineWidth = 3;
    for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(cx + i * 20, hz); c.lineTo(cx + i * 150, 1024); c.stroke(); }
    for (let j = 0; j < 9; j++) { const y = hz + Math.pow(j / 8, 1.8) * (1024 - hz); c.beginPath(); c.moveTo(0, y); c.lineTo(1024, y); c.stroke(); }
  } else sunsetScene(c, k, 1024);
  const w = 1024 * 0.95, h = w; c.drawImage(ROBOT, cx - w / 2, cy - h / 2 + 30, w, h);
  gloss(c, k, cx, cy, R);
});
const RA = robotAvatar(false), RB = robotAvatar(true);
save("robot-bot-A", RA); save("robot-bot-A-512", scaleTo(RA, 512));
save("robot-bot-B", RB); save("robot-bot-B-512", scaleTo(RB, 512));
save("robot-cabeza-transparente", ROBOT);
{
  const W = 1500, H = 1000, cv = createCanvas(W, H), c = cv.getContext("2d");
  c.fillStyle = "#0e0e12"; c.fillRect(0, 0, W, H);
  c.font = "56px PBlack"; c.fillStyle = "#fff"; c.fillText("Robot del bot · 2 fondos", 60, 90);
  [["A · Atardecer", RA], ["B · Neón", RB]].forEach(([n, img], i) => {
    const x = 60 + i * 720;
    c.save(); c.beginPath(); c.arc(x + 300, 440, 300, 0, 7); c.clip(); c.drawImage(img, x, 140, 600, 600); c.restore();
    c.font = "40px PBlack"; c.fillStyle = "#fff"; c.fillText(n, x, 800);
    for (const [j, bg, sub] of [[0, "#313338", "#b5bac1"], [1, "#ffffff", "#5c5e66"]]) {
      const y = 830 + j * 80, xx = x + (j ? 0 : 0);
      c.fillStyle = bg; c.beginPath(); c.roundRect(x, y, 640, 70, 12); c.fill();
      c.save(); c.beginPath(); c.arc(x + 35, y + 35, 20, 0, 7); c.clip(); c.drawImage(scaleTo(img, 40), x + 15, y + 15); c.restore();
      c.font = "24px PS"; c.fillStyle = "#e8392f"; c.fillText("SampCity", x + 68, y + 43); const nx = x + 68 + c.measureText("SampCity").width + 10;
      c.fillStyle = "#5865f2"; c.beginPath(); c.roundRect(nx, y + 22, 52, 24, 5); c.fill(); c.font = "16px PS"; c.fillStyle = "#fff"; c.fillText("BOT", nx + 10, y + 40);
      c.font = "22px PS"; c.fillStyle = sub; c.fillText("¡Hola! Escribe !comandos", nx + 70, y + 43);
    }
  });
  save("robot-bot-opciones", cv);
}

// ---------------- 5. Manual de marca ----------------
function manual() {
  const W = 2480, H = 3508, cv = createCanvas(W, H), c = cv.getContext("2d"); // A4 a 300 ppp
  c.fillStyle = "#101014"; c.fillRect(0, 0, W, H);
  const T = (t, x, y, s, col = "#fff", f = "PBlack") => { c.font = `${s}px ${f}`; c.fillStyle = col; c.fillText(t, x, y); };
  const fit = (img, x, y, w, h) => { const k = Math.min(w / img.width, h / img.height); c.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k); };
  T("MANUAL DE MARCA", 150, 220, 120); T("sampcity · identidad visual v1 · 2026", 150, 300, 50, "rgba(255,255,255,.55)", "PS");
  T("1 · Logotipo principal", 150, 420, 60);
  c.fillStyle = "#1c1c22"; c.beginPath(); c.roundRect(150, 460, W - 300, 640, 30); c.fill();
  fit(L.principal, 250, 500, W - 500, 560);
  T("2 · Variantes", 150, 1210, 60);
  const vars = [["plano", "#1c1c22"], ["apilado", "#1c1c22"], ["blanco", "#3a0a14"], ["oscuro", "#f0f0f3"], ["cromo_rojo", "#1c1c22"], ["oro", "#1c1c22"]];
  const cw = (W - 300 - 2 * 40) / 3, ch = 360;
  vars.forEach(([k, bg], i) => { const x = 150 + (i % 3) * (cw + 40), y = 1250 + Math.floor(i / 3) * (ch + 90); c.fillStyle = bg; c.beginPath(); c.roundRect(x, y, cw, ch, 24); c.fill(); fit(L[k], x + 40, y + 40, cw - 80, ch - 80); T(k.replace("_", " + "), x + 10, y + ch + 55, 40, "rgba(255,255,255,.75)", "PS"); });
  T("3 · Colores", 150, 2240, 60);
  const cols = [["Rosa samp", "#F59D99"], ["Rojo city", "#E8392F"], ["Granate", "#9E150F"], ["Contorno", "#0A0202"], ["Blanco", "#FFFFFF"]];
  cols.forEach(([n, hex], i) => { const x = 150 + i * 440, y = 2280; c.fillStyle = hex; c.beginPath(); c.roundRect(x, y, 400, 240, 24); c.fill(); c.strokeStyle = "rgba(255,255,255,.2)"; c.lineWidth = 4; c.stroke(); T(n, x, y + 300, 40, "#fff", "PS"); T(hex, x, y + 352, 40, "rgba(255,255,255,.6)", "PS"); });
  T("4 · Tipografía e íconos", 150, 2780, 60);
  c.font = "150px Russo"; c.fillStyle = "#F59D99"; c.fillText("Russo One", 150, 2960);
  T("Tipografía del logotipo (licencia libre SIL OFL).", 150, 3030, 38, "rgba(255,255,255,.6)", "PS");
  T("Textos y piezas: Poppins.", 150, 3080, 38, "rgba(255,255,255,.6)", "PS");
  fit(iconSquare(512), 1650, 2820, 280, 280); fit(iconCircle(512), 2000, 2820, 280, 280);
  T("5 · Reglas de uso", 150, 3220, 50);
  T("No deformar ni cambiar colores fuera de las variantes · margen libre = alto de la letra \"c\" · ancho mínimo 120 px.", 150, 3290, 34, "rgba(255,255,255,.6)", "PS");
  T("Usar ™ mientras el registro está en trámite · ® solo cuando la marca esté registrada.", 150, 3345, 34, "rgba(255,255,255,.6)", "PS");
  return cv;
}
save("manual-de-marca-A4", manual());

// ---------------- 6. Hoja resumen para verlo todo ----------------
function sheet() {
  const W = 2400, H = 1700, cv = createCanvas(W, H), c = cv.getContext("2d");
  c.fillStyle = "#0e0e12"; c.fillRect(0, 0, W, H);
  const fit = (img, x, y, w, h) => { const k = Math.min(w / img.width, h / img.height); c.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k); };
  c.font = "64px PBlack"; c.fillStyle = "#fff"; c.fillText("sampcity · variantes", 70, 100);
  const items = [["principal", "#1b1b22"], ["cromo_rojo", "#1b1b22"], ["oro", "#1b1b22"], ["neon", "#0a0716"], ["blanco", "#5a0f1f"], ["oscuro", "#eeeef2"], ["plano", "#ffffff"], ["apilado", "#1b1b22"]];
  items.forEach(([k, bg], i) => { const x = 70 + (i % 4) * 575, y = 150 + Math.floor(i / 4) * 470; c.fillStyle = bg; c.beginPath(); c.roundRect(x, y, 545, 400, 22); c.fill(); fit(L[k], x + 30, y + 30, 485, 340); c.font = "30px PS"; c.fillStyle = "rgba(255,255,255,.7)"; c.fillText(k.replace("_", " + "), x + 8, y + 440); });
  let x = 70; for (const s of [256, 128, 64, 48, 32, 16]) { const ic = iconSquare(s); c.drawImage(ic, x, 1120 + (256 - s) / 2); x += s + 50; }
  x = 70; for (const s of [256, 128, 64, 48, 32, 16]) { const ic = iconCircle(s); c.drawImage(ic, x, 1400 + (256 - s) / 2 - 20); x += s + 50; }
  c.drawImage(scaleTo(WM_W, 700), 1500, 1250);
  c.font = "30px PS"; c.fillStyle = "rgba(255,255,255,.7)"; c.fillText("Íconos PNG: 1024 · 512 · 256 · 128 · 64 · 48 · 32 · 16", 70, 1680); c.fillText("Marca de agua (40 %)", 1500, 1230);
  return cv;
}
save("_resumen", sheet());
console.log(fs.readdirSync(OUT).length, "archivos");
