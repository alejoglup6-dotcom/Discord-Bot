/*
 * Imagen de un tuit (modo oscuro de X) hecha en el bot, para /images tweet y /images trumptweet.
 * Antes la generaba nekobot.xyz, que ahora bloquea a los bots (403) y el comando no contestaba (11-oct-2026).
 */
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("./canvasLib");

const FONT_DIR = path.join(__dirname, "../fonts");
let fontsReady = false;
function loadFonts() {
  if (fontsReady) return;
  registerFont(path.join(FONT_DIR, "Poppins-Bold.ttf"), "PoppinsBold");
  registerFont(path.join(FONT_DIR, "Poppins-Medium.ttf"), "PoppinsMedium");
  registerFont(path.join(FONT_DIR, "DejaVuSans-Bold.ttf"), "DejaVuBold");
  fontsReady = true;
}

function lineas(ctx, texto, ancho) {
  const out = [];
  for (const parrafo of String(texto).split("\n")) {
    let actual = "";
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width > ancho && actual) { out.push(actual); actual = palabra; }
      else actual = prueba;
    }
    out.push(actual);
  }
  return out;
}

// { nombre, usuario, avatar (url o null), texto, verificado, etiqueta } -> Buffer PNG
async function tweetCard({ nombre, usuario, avatar, texto, verificado = false, etiqueta = null }) {
  loadFonts();
  const W = 1000, PAD = 48, AV = 96;
  const medir = createCanvas(10, 10).getContext("2d");
  medir.font = "34px PoppinsMedium";
  const ls = lineas(medir, texto, W - PAD * 2).slice(0, 12);
  const H = PAD + AV + 36 + ls.length * 48 + 70 + PAD;
  const cv = createCanvas(W, H), g = cv.getContext("2d");
  g.fillStyle = "#000000"; g.fillRect(0, 0, W, H);
  // avatar redondo (o inicial si no se puede bajar)
  g.save(); g.beginPath(); g.arc(PAD + AV / 2, PAD + AV / 2, AV / 2, 0, Math.PI * 2); g.closePath(); g.clip();
  let ok = false;
  if (avatar) { try { g.drawImage(await loadImage(avatar), PAD, PAD, AV, AV); ok = true; } catch { /* inicial */ } }
  if (!ok) {
    g.fillStyle = "#1d9bf0"; g.fillRect(PAD, PAD, AV, AV);
    g.fillStyle = "#fff"; g.font = "48px PoppinsBold"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(nombre || "?").trim().charAt(0).toUpperCase(), PAD + AV / 2, PAD + AV / 2 + 2);
  }
  g.restore();
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  const x = PAD + AV + 22;
  g.fillStyle = "#e7e9ea"; g.font = "32px PoppinsBold";
  const n = String(nombre).slice(0, 40);
  g.fillText(n, x, PAD + 42);
  let fin = x + g.measureText(n).width + 10;
  if (verificado) {
    g.fillStyle = "#1d9bf0"; g.beginPath(); g.arc(fin + 14, PAD + 31, 14, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 4; g.beginPath(); g.moveTo(fin + 7, PAD + 31); g.lineTo(fin + 12, PAD + 37); g.lineTo(fin + 21, PAD + 25); g.stroke();
    fin += 36;
  }
  if (etiqueta) {
    g.font = "20px DejaVuBold"; const w = g.measureText(etiqueta).width + 20;
    g.fillStyle = "#e8392f"; g.fillRect(fin + 6, PAD + 14, w, 32);
    g.fillStyle = "#fff"; g.fillText(etiqueta, fin + 16, PAD + 38);
  }
  g.fillStyle = "#71767b"; g.font = "28px PoppinsMedium";
  g.fillText(`@${String(usuario).slice(0, 30)}`, x, PAD + 82);
  g.fillStyle = "#e7e9ea"; g.font = "34px PoppinsMedium";
  ls.forEach((l, i) => g.fillText(l, PAD, PAD + AV + 56 + i * 48));
  const fecha = new Date().toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric" });
  g.fillStyle = "#71767b"; g.font = "24px PoppinsMedium";
  g.fillText(fecha, PAD, H - PAD - 6);
  g.fillStyle = "#2f3336"; g.fillRect(PAD, H - PAD - 44, W - PAD * 2, 2);
  return cv.toBuffer("image/png");
}

module.exports = { tweetCard };
