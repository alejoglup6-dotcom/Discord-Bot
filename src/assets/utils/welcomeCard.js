/*
 * Tarjetas de bienvenida y despedida (1100x500): banner de fondo, foto del usuario con aro de color,
 * nombre, número de miembro y logo del servidor.
 * Fondo: WELCOME_BANNER del .env (URL de una imagen), si no el banner del servidor de Discord, y si no
 * un atardecer de Los Santos dibujado aquí. La fuente (Poppins) va incluida porque muchos hostings no tienen.
 */
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

const W = 1100;
const H = 500;
const FONT_DIR = path.join(__dirname, "../fonts");
let fontsReady = false;

function loadFonts() {
  if (fontsReady) return;
  registerFont(path.join(FONT_DIR, "Poppins-Bold.ttf"), { family: "Poppins", weight: "bold" });
  registerFont(path.join(FONT_DIR, "Poppins-SemiBold.ttf"), { family: "Poppins SemiBold" });
  registerFont(path.join(FONT_DIR, "Poppins-Medium.ttf"), { family: "Poppins Medium" });
  fontsReady = true;
}

const THEMES = {
  welcome: { accent: ["#ffb347", "#ff4f81"], title: "¡BIENVENIDO/A!", sky: ["#1b0f3b", "#6a1b6f", "#ff6b4a", "#ffc26b"] },
  leave: { accent: ["#9aa5b1", "#ff5a5a"], title: "¡HASTA PRONTO!", sky: ["#0b1020", "#1d2745", "#4a3a64", "#8a5a6e"] },
};

// La fuente no tiene emojis ni letras "de adorno": se quitan para que no salgan cuadrados
function printable(text, fallback) {
  const clean = String(text || "")
    .replace(/[^ -ɏ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean || fallback;
}

function fit(ctx, text, maxWidth, font, sizes) {
  for (const size of sizes) {
    ctx.font = font(size);
    if (ctx.measureText(text).width <= maxWidth) return text;
  }
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

// Números pseudoaleatorios estables (el mismo servidor dibuja siempre la misma ciudad)
function seeded(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function drawSkyline(ctx, theme, seed) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  theme.sky.forEach((c, i) => sky.addColorStop(i / (theme.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sol
  const sun = ctx.createRadialGradient(W * 0.72, H * 0.78, 10, W * 0.72, H * 0.78, 260);
  sun.addColorStop(0, "rgba(255,230,160,0.95)");
  sun.addColorStop(0.35, "rgba(255,160,90,0.45)");
  sun.addColorStop(1, "rgba(255,120,80,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  const rand = seeded(seed);
  // Dos filas de edificios: la de atrás más clara
  for (const [base, color, minH, maxH, windows] of [
    [H * 0.8, "rgba(40,18,60,0.75)", 60, 190, false],
    [H, "rgba(12,6,24,0.95)", 90, 260, true],
  ]) {
    let x = -20;
    while (x < W + 20) {
      const w = 40 + rand() * 70;
      const h = minH + rand() * (maxH - minH);
      ctx.fillStyle = color;
      ctx.fillRect(x, base - h, w, h);
      if (windows) {
        ctx.fillStyle = "rgba(255,200,120,0.55)";
        for (let wy = base - h + 12; wy < base - 20; wy += 18) {
          for (let wx = x + 8; wx < x + w - 10; wx += 14) if (rand() < 0.28) ctx.fillRect(wx, wy, 6, 8);
        }
      }
      x += w + 4;
    }
  }

  // Palmeras
  ctx.strokeStyle = "rgba(8,4,16,0.95)";
  ctx.fillStyle = "rgba(8,4,16,0.95)";
  for (const px of [W * 0.06, W * 0.93]) {
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(px, H);
    ctx.quadraticCurveTo(px + 18, H - 120, px + 6, H - 230);
    ctx.stroke();
    for (let a = 0; a < 7; a++) {
      const ang = (-Math.PI / 2) + (a - 3) * 0.45;
      ctx.beginPath();
      ctx.moveTo(px + 6, H - 230);
      ctx.quadraticCurveTo(px + 6 + Math.cos(ang) * 60, H - 250 + Math.sin(ang) * 40, px + 6 + Math.cos(ang) * 95, H - 210 + Math.sin(ang) * 55);
      ctx.lineWidth = 7;
      ctx.stroke();
    }
  }
}

async function drawCover(ctx, url) {
  const img = await loadImage(url);
  const scale = Math.max(W / img.width, H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

/**
 * @param {object} o
 * @param {"welcome"|"leave"} o.type
 * @param {string} o.avatarURL
 * @param {string} o.name nombre a mostrar
 * @param {string} o.guildName
 * @param {string} [o.guildIconURL]
 * @param {string} [o.backgroundURL]
 * @param {number} o.memberCount
 * @param {string} [o.seed]
 * @returns {Promise<Buffer>} PNG
 */
async function makeCard(o) {
  loadFonts();
  const theme = THEMES[o.type] || THEMES.welcome;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Fondo
  let drawn = false;
  if (o.backgroundURL) {
    try {
      await drawCover(ctx, o.backgroundURL);
      drawn = true;
    } catch {}
  }
  if (!drawn) drawSkyline(ctx, theme, o.seed || o.guildName);
  if (o.type === "leave") {
    // Despedida en tonos apagados
    ctx.fillStyle = "rgba(20,24,40,0.35)";
    ctx.fillRect(0, 0, W, H);
  }

  // Oscurecer para que se lea el texto
  const shade = ctx.createLinearGradient(0, 0, W, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.55)");
  shade.addColorStop(0.55, "rgba(0,0,0,0.35)");
  shade.addColorStop(1, "rgba(0,0,0,0.15)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  // Panel de cristal
  ctx.save();
  ctx.fillStyle = "rgba(10,10,20,0.32)";
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  roundRect(ctx, 30, 30, W - 60, H - 60, 28);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Foto del usuario con aro degradado y resplandor
  const cx = 230;
  const cy = H / 2;
  const r = 130;
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, theme.accent[0]);
  ring.addColorStop(1, theme.accent[1]);
  ctx.save();
  ctx.shadowColor = theme.accent[1];
  ctx.shadowBlur = 40;
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#15131f";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.fill();
  try {
    const avatar = await loadImage(o.avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
    if (o.type === "leave") {
      ctx.fillStyle = "rgba(20,24,40,0.25)";
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.restore();
  } catch {}

  // Textos
  const x = 420;
  const maxW = W - x - 70;
  ctx.textBaseline = "alphabetic";

  const titleGrad = ctx.createLinearGradient(x, 0, x + 420, 0);
  titleGrad.addColorStop(0, theme.accent[0]);
  titleGrad.addColorStop(1, theme.accent[1]);
  ctx.fillStyle = titleGrad;
  ctx.font = '38px "Poppins SemiBold"';
  ctx.fillText(theme.title, x, 150);

  const name = printable(o.name, "Nuevo miembro");
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 12;
  const shownName = fit(ctx, name, maxW, (s) => `bold ${s}px Poppins`, [72, 64, 56, 48, 42]);
  ctx.fillText(shownName, x, 235);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  const sub = o.type === "leave" ? `dejó ${printable(o.guildName, "el servidor")}` : `a ${printable(o.guildName, "nuestro servidor")}`;
  ctx.fillText(fit(ctx, sub, maxW, (s) => `${s}px "Poppins Medium"`, [32, 28, 24]), x, 290);

  // Etiqueta con el número de miembro
  const badge = o.type === "leave" ? `Ahora somos ${o.memberCount.toLocaleString("es-ES")}` : `Miembro #${o.memberCount.toLocaleString("es-ES")}`;
  ctx.font = '26px "Poppins SemiBold"';
  const bw = ctx.measureText(badge).width + 44;
  const badgeGrad = ctx.createLinearGradient(x, 0, x + bw, 0);
  badgeGrad.addColorStop(0, theme.accent[0]);
  badgeGrad.addColorStop(1, theme.accent[1]);
  ctx.fillStyle = badgeGrad;
  roundRect(ctx, x, 325, bw, 52, 26);
  ctx.fill();
  ctx.fillStyle = "#1a1025";
  ctx.fillText(badge, x + 22, 360);

  // Logo del servidor
  if (o.guildIconURL) {
    try {
      const icon = await loadImage(o.guildIconURL);
      const s = 70;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W - 80, 90, s / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(icon, W - 80 - s / 2, 90 - s / 2, s, s);
      ctx.restore();
    } catch {}
  }

  return canvas.toBuffer("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

module.exports = { makeCard, printable };
