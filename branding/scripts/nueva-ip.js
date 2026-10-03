/*
 * Anuncio de la IP nueva del servidor (3-oct-2026), con el estilo de las piezas de la actualización (portada de GTA SA).
 * Uso: node branding/scripts/nueva-ip.js <carpeta de renders>  ->  branding/marca/actualizacion-3oct/nueva-ip.jpg
 * Renders: ip.png (centro de Los Santos desde la colina, tools/render), piloto.png, facciones.png, ladron.png
 */
const path = require("path");
const fs = require("fs");
const { loadImage } = require("@napi-rs/canvas");
const { createCanvas } = require("./lib");
const { paint, panel, label, bigText, drawLogo, INK } = require("./actualizacion");

const IN = path.resolve(process.argv[2] || ".");
const OUT = path.join(__dirname, "../marca/actualizacion-3oct");
const IP = "sv.sampcity.app:7781";

(async () => {
  const L = async (n) => loadImage(path.join(IN, n + ".png"));
  const city = paint(await L("ip"), "tarde", [[920, 230, 260, "rgba(255,210,140,.25)"]]);
  const strip = [
    ["piloto", paint(await L("piloto"), "dia"), [0.55, 0.45, 1.2]],
    ["facciones", paint(await L("facciones"), "dia"), [0.62, 0.6, 1.3]],
    ["ladron", paint(await L("ladron"), "noche", [[1200, 700, 230, "rgba(255,40,40,.55)"], [1330, 660, 230, "rgba(40,90,255,.55)"]]), [0.56, 0.55, 1.2]],
  ];
  const W = 1920, H = 1080, cv = createCanvas(W, H), c = cv.getContext("2d");
  c.fillStyle = INK; c.fillRect(0, 0, W, H);
  panel(c, city, 12, 12, 1896, 760, [0.56, 0.42, 1.12]);
  strip.forEach(([, img, f], i) => panel(c, img, 12 + i * 636, 784, i === 2 ? 1908 - (12 + i * 636) : 624, 284, f));

  drawLogo(c, 330, 120, 500);
  bigText(c, "¡NUEVA IP!", 960, 330, 150, "#ffffff", "center", "Lucky");
  // la IP en grande, en caja negra con franja roja (como los rotulos de las portadas)
  c.save();
  c.font = "92px PBlack";
  const tw = c.measureText(IP).width, bw = tw + 120, bx = 960 - bw / 2, by = 395, bh = 150;
  c.fillStyle = INK; c.fillRect(bx, by, bw, bh);
  c.fillStyle = "#E8392F"; c.fillRect(bx, by + bh - 12, bw, 12);
  c.fillStyle = "#F59D99"; c.fillRect(bx, by, bw, 6);
  c.textBaseline = "middle"; c.fillStyle = "#ffffff"; c.fillText(IP, bx + 60, by + bh / 2 - 2);
  c.restore();
  label(c, "ANDROID Y PC", 945, 580, 40, "right", "#4fd8ff", "Agrégala a tus favoritos y conéctate");
  label(c, "FASE BETA ABIERTA", 975, 580, 40, "left", "#57f287", "Te esperamos en Los Santos");
  const f = path.join(OUT, "nueva-ip.jpg");
  fs.writeFileSync(f, cv.toBuffer("image/jpeg", 92));
  console.log("ok", f);
})().catch((e) => { console.error(e); process.exit(1); });
