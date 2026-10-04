/*
 * Imágenes del anuncio del 4-oct-2026 (verificación con la cuenta del juego y rangos), con el estilo de las de la
 * actualización del 3-oct (branding/scripts/actualizacion.js): fondo de un render del juego "pintado", viñetas con
 * borde negro y rótulos.
 *
 * Uso: node branding/scripts/verificacion.js <carpeta> [salida]
 *   <carpeta>: renders del juego (cartel.png, facciones.png; los de tools/render del repo Backup) y capturas de
 *   https://sampcity.app/verificar a 420 px de ancho (verificar.png y verificar-login.png, con el formulario abierto).
 *   salida por defecto: branding/marca/verificacion-4oct/ (verificacion.jpg, rangos.jpg y, si está la captura
 *   verificar-registro.png del formulario de Crear cuenta, registro.jpg)
 */
const path = require("path");
const fs = require("fs");
const { loadImage } = require("@napi-rs/canvas");
const { createCanvas } = require("./lib");
const { paint, panel, label, bigText, drawLogo, INK } = require("./actualizacion");
const data = require("../../src/assets/data/rangos");

const IN = path.resolve(process.argv[2] || ".");
const OUT = path.resolve(process.argv[3] || path.join(__dirname, "../marca/verificacion-4oct"));
fs.mkdirSync(OUT, { recursive: true });
const W = 1920, H = 1080;

function save(cv, name) {
  const f = path.join(OUT, name + ".jpg");
  fs.writeFileSync(f, cv.toBuffer("image/jpeg", 92));
  console.log("ok", f);
}

// Fondo: render pintado y oscurecido para que se lea lo de encima
function background(c, img, grade) {
  const p = paint(img, grade);
  panel(c, p, 0, 0, W, H);
  c.fillStyle = "rgba(10,2,6,.62)";
  c.fillRect(0, 0, W, H);
}

// Número grande en un círculo (los pasos)
function step(c, n, x, y) {
  c.save();
  c.beginPath(); c.arc(x, y, 58, 0, 7); c.fillStyle = "#E8392F"; c.fill();
  c.lineWidth = 10; c.strokeStyle = INK; c.stroke();
  c.restore();
  bigText(c, String(n), x, y + 30, 84, "#ffffff", "center");
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// Paso 3: el panel del canal de verificación (el del bot), dibujado
function discordStep(c, x, y, w, h) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#1A0612"); g.addColorStop(1, "#3a0d18");
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const cx = x + 40, cw = w - 80;
  c.fillStyle = "#24101a"; roundRect(c, cx, y + 70, cw, h - 140, 18); c.fill();
  c.fillStyle = "#E8392F"; c.fillRect(cx, y + 70, 10, h - 140);
  c.fillStyle = "#ffffff"; c.font = "30px PBlack"; c.textBaseline = "top";
  c.fillText("VERIFICACIÓN", cx + 36, y + 100);
  c.font = "26px PXB"; c.fillStyle = "#e9d6d8";
  const lines = ["En el canal verificación", "pulsa el botón:"];
  lines.forEach((l, i) => c.fillText(l, cx + 36, y + 160 + i * 38));
  // botones
  const bx = cx + 36, bw = cw - 72;
  c.fillStyle = "#4a2530"; roundRect(c, bx, y + 270, bw, 74, 14); c.fill();
  c.fillStyle = "#ffffff"; c.font = "28px PBlack"; c.fillText("Verificarme en la web", bx + 26, y + 292);
  c.fillStyle = "#2FD36B"; roundRect(c, bx, y + 366, bw, 74, 14); c.fill();
  c.lineWidth = 6; c.strokeStyle = "#ffffff"; roundRect(c, bx - 3, y + 363, bw + 6, 80, 16); c.stroke();
  c.fillStyle = INK; c.font = "30px PBlack"; c.fillText("Ya me vinculé", bx + 26, y + 388);
  c.font = "24px PXB"; c.fillStyle = "#FFC9C4";
  ["Se abren todos los canales", "y tu apodo pasa a ser", "el de tu personaje."].forEach((l, i) => c.fillText(l, bx, y + 470 + i * 34));
  c.lineWidth = 10; c.strokeStyle = INK; c.strokeRect(x + 5, y + 5, w - 10, h - 10);
}

(async () => {
  const L = (n) => loadImage(path.join(IN, n));

  // ---------------------------------------------------------- 1. Verificación en 3 pasos
  {
    const cv = createCanvas(W, H), c = cv.getContext("2d");
    background(c, await L("cartel.png"), "tarde");
    drawLogo(c, 250, 92, 360);
    bigText(c, "VERIFÍCATE EN 3 PASOS", W / 2 + 120, 128, 92, "#ffffff", "center");
    c.font = "34px PXB"; c.fillStyle = "#FFC9C4"; c.textAlign = "center";
    c.fillText("Para ver todo el Discord, une tu cuenta del juego · sampcity.app/verificar", W / 2 + 120, 184);
    c.textAlign = "left";

    const pw = 540, ph = 640, gap = 70, x0 = (W - (pw * 3 + gap * 2)) / 2, py = 290;
    const web = await L("verificar.png"), login = await L("verificar-login.png");
    panel(c, login, x0, py, pw, ph, [0.5, 0.52, 1]);
    panel(c, web, x0 + pw + gap, py, pw, ph, [0.5, 0.56, 1]);
    discordStep(c, x0 + (pw + gap) * 2, py, pw, ph);
    // resalta la tarjeta "Vincula tu Discord" de la captura (y 922-1175, x 58-782 de verificar.png)
    {
      const sc = Math.max(pw / web.width, ph / web.height), top = web.height * 0.56 - ph / sc / 2;
      const hx = x0 + pw + gap + 58 * sc, hy = py + (922 - top) * sc, hw = (782 - 58) * sc, hh = (1175 - 922) * sc;
      c.save(); c.lineWidth = 8; c.strokeStyle = "#F59D99"; c.shadowColor = "#E8392F"; c.shadowBlur = 24;
      roundRect(c, hx - 6, hy - 6, hw + 12, hh + 12, 18); c.stroke(); c.restore();
    }
    const caps = [
      ["INICIA SESIÓN", "Tu Nombre_Apellido y contraseña"],
      ["VINCULA DISCORD", "Pulsa Vincular y acepta"],
      ["VUELVE AL DISCORD", "Pulsa Ya me vinculé"],
    ];
    caps.forEach(([t, s], i) => {
      const x = x0 + i * (pw + gap);
      step(c, i + 1, x + 30, py - 4);
      label(c, t, x + 20, py + ph - 60, 40, "left", "#E8392F", s);
    });
    c.font = "28px PXB"; c.fillStyle = "#ffffff"; c.textAlign = "center";
    c.fillText("¿Sin cuenta? Créala en la misma web con Crear cuenta", W / 2, H - 40);
    save(cv, "verificacion");
  }

  // ---------------------------------------------------------- 3. Registro desde la web
  if (fs.existsSync(path.join(IN, "verificar-registro.png"))) {
    const cv = createCanvas(W, H), c = cv.getContext("2d");
    background(c, await L("piloto.png"), "dia");
    drawLogo(c, 250, 92, 360);
    bigText(c, "CREA TU CUENTA EN LA WEB", W / 2 + 120, 128, 92, "#ffffff", "center");
    c.font = "34px PXB"; c.fillStyle = "#FFC9C4"; c.textAlign = "center";
    c.fillText("Ya no hace falta entrar al juego para registrarte · sampcity.app", W / 2 + 120, 184);
    c.textAlign = "left";
    const reg = await L("verificar-registro.png");
    panel(c, reg, 140, 250, 620, 760, [0.5, 0.5, 1.05]);
    const steps = [
      ["CREA TU CUENTA", "sampcity.app · Crear cuenta: Nombre_Apellido, correo y contraseña"],
      ["VINCULA TU DISCORD", "En la misma web, sin entrar al juego: se abren todos los canales"],
      ["ENTRA AL SERVIDOR", "sv.sampcity.app:7781 · la primera vez creas tu personaje"],
    ];
    steps.forEach(([t, s2], i) => {
      const y = 300 + i * 230;
      step(c, i + 1, 900, y + 40);
      label(c, t, 990, y, 50, "left", "#E8392F", s2);
    });
    c.font = "28px PXB"; c.fillStyle = "#ffffff"; c.textAlign = "center";
    c.fillText("Con la misma cuenta entras al juego y a la web", W / 2, H - 40);
    save(cv, "registro");
  }

  // ---------------------------------------------------------- 2. Rangos del juego en Discord
  {
    const cv = createCanvas(W, H), c = cv.getContext("2d");
    background(c, await L("facciones.png"), "noche");
    drawLogo(c, 250, 92, 360);
    bigText(c, "TUS RANGOS, AL MOMENTO", W / 2 + 120, 128, 92, "#ffffff", "center");
    c.font = "34px PXB"; c.fillStyle = "#FFC9C4"; c.textAlign = "center";
    c.fillText("Lo que tienes en el juego aparece en Discord en segundos, en orden de jerarquía", W / 2 + 120, 184);
    c.textAlign = "left";

    // escalera de staff con los colores de los roles
    const staff = data.RANKS.filter((r) => r.cat === "staff");
    const sx = 120, sy = 250, bh = 66, bw = 760;
    label(c, "STAFF", sx, sy, 40);
    staff.forEach((r, i) => {
      const y = sy + 90 + i * (bh + 10), w = bw - i * 34;
      c.fillStyle = r.color || "#888"; c.fillRect(sx, y, w, bh);
      c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(sx, y + bh - 12, w, 12);
      c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(sx + 3, y + 3, w - 6, bh - 6);
      const name = r.role.replace(/^[^A-Za-zÁÉÍÓÚÑ]+/, "");
      bigText(c, name, sx + 26, y + 48, 38, "#ffffff");
    });

    // a la derecha: lo que trae
    const rx = 1000, items = [
      ["FACCIONES COMPLETAS", "Cada rango de LSPD, Sheriff, FBI, Militar, Gobierno y CityTV"],
      ["BANDA, VIP Y NIVEL", "Líder o miembro, VIP o Socio, y tu nivel del juego"],
      ["LOGROS E INSIGNIAS", "Embajador por invitaciones, campeón de eventos..."],
      ["ETIQUETA EN LA CABEZA", "Elige cuál se ve con /rango en el juego"],
    ];
    items.forEach(([t, s], i) => label(c, t, rx, 300 + i * 175, 46, "left", "#E8392F", s));
    c.font = "28px PXB"; c.fillStyle = "#ffffff"; c.textAlign = "center";
    c.fillText("Solo para cuentas verificadas · sampcity.app/verificar", W / 2, H - 40);
    save(cv, "rangos");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
