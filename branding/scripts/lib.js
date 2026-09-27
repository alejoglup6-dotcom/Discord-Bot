/*
 * Piezas comunes de la marca: fuentes, paletas y el logotipo 3D (wordmark). Las usan marca.js y los scripts de
 * piezas sueltas (p. ej. beta.js).
 */
const path = require("path");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const D = path.join(__dirname, "../fonts");
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


module.exports = { createCanvas, GlobalFonts, P, PAIRS, mix, trim, wordmark, wm, icoLetters };
