/*
 * Shorts verticales (1080x1920, 30 fps) para TikTok / Reels / YouTube Shorts con el material del servidor.
 *
 *   node --expose-gc branding/scripts/shorts.js <carpeta-de-material> [nombre ...]   -> branding/shorts/<nombre>.mp4
 *
 * Material (no va al repo, pesa mucho): en la carpeta que se pasa
 *   zona.mp4        grabación del juego (policía en Pershing Square), 1280x720
 *   inventario.jpg  captura del inventario nuevo en el juego (2720x1224)
 *   dt.mp4, ph.mp4, pier.mp4  tomas de drone verticales hechas con el repo Backup:
 *     node --no-warnings tools/render/video.js --render --size 1080x1920 --fov 55 --seconds 5 \
 *       --target 1560,-1360,60 --radius 330 --height 230 --from 200 --to 250 --out dt.mp4     (centro)
 *       --target 1480,-1720,30 --radius 260 --height 160 --from 250 --to 300 --out ph.mp4     (ayuntamiento)
 *       --target 380,-2040,8   --radius 150 --height 60  --from 60  --to 110 --out pier.mp4   (muelle)
 *
 * Formato (guía de TikTok y de clips de videojuegos): el gancho en los 3 primeros segundos con texto grande, 6-8
 * palabras por texto, un corte cada 2-3 s con zoom o destello, textos dentro de la zona segura (TikTok tapa abajo y a
 * la derecha) y tarjeta final con el Discord. Sin música: se le pone un sonido de moda al subirlo en la app.
 */
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { wordmark, wm, P, PAIRS } = require("./lib.js");

const ROOT = path.join(__dirname, "..");
GlobalFonts.registerFromPath(ROOT + "/fonts/Poppins-ExtraBold.ttf", "PXB");
const W = 1080, H = 1920, FPS = 30;
const DISCORD = "discord.gg/QU7YWerPfV";
const ROSA = "#F59D99", ROJO = "#E8392F", AMARILLO = "#FFD84A";
const SRC = path.resolve(process.argv[2] || ".");
const OUT = path.join(ROOT, "shorts");
const FF = process.env.FFMPEG || execFileSync("python3", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();

const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
// "pop": crece de 0,6 a 1 con un pequeño rebote en 0,22 s
const pop = (t) => { if (t <= 0) return 0; if (t >= 0.22) return 1; const x = t / 0.22; return 0.6 + 0.4 * (1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2)); };

// ---------------------------------------------------------------- material
const cache = new Map();
async function img(p) { if (!cache.has(p)) cache.set(p, await loadImage(p)); return cache.get(p); }

/** Saca los fotogramas de un video a jpg (una vez) con un filtro de ffmpeg que deja el cuadro en 1080x1920. */
function frames(name, src, vf, ss = 0, dur = null) {
  const dir = path.join(SRC, "frames-" + name);
  if (!fs.existsSync(path.join(SRC, src))) { console.warn("falta " + src); return { dir, n: 0 }; }
  if (!fs.existsSync(path.join(dir, "f0001.jpg"))) {
    fs.mkdirSync(dir, { recursive: true });
    const a = ["-y", "-loglevel", "error", "-ss", String(ss)];
    if (dur) a.push("-t", String(dur));
    a.push("-i", path.join(SRC, src), "-vf", `fps=${FPS},${vf}`, "-q:v", "3", path.join(dir, "f%04d.jpg"));
    execFileSync(FF, a);
  }
  return { dir, n: fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length };
}
// jugabilidad horizontal: arriba y abajo el mismo video borroso, en medio el recorte nítido (formato típico de TikTok)
const HORIZ = (crop) => `split[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=24:2,eq=brightness=-0.18[bg];[b]${crop},scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2-60`;

// ---------------------------------------------------------------- dibujo
function fondoVideo(clip, desde = 0, zoom = [1, 1.06]) {
  return async (c, t, d) => {
    if (!clip.n) return;
    const i = Math.min(clip.n, Math.max(1, Math.floor((desde + t) * FPS) + 1));
    const im = await img(path.join(clip.dir, `f${String(i).padStart(4, "0")}.jpg`));
    const z = zoom[0] + (zoom[1] - zoom[0]) * (t / d);
    c.drawImage(im, (W - W * z) / 2, (H - H * z) / 2, W * z, H * z);
    cache.delete(path.join(clip.dir, `f${String(i).padStart(4, "0")}.jpg`));
  };
}
/** Imagen fija con zoom/paneo suave: rectángulos de origen [x, y, ancho] (alto sale de la proporción 9:16). */
function fondoImagen(file, r0, r1, oscuro = 0) {
  return async (c, t, d) => {
    const im = await img(file), k = ease(clamp(t / d));
    const r = r0.map((v, i) => v + (r1[i] - v) * k), w = r[2], h = w * H / W;
    c.drawImage(im, r[0], r[1], w, h, 0, 0, W, H);
    if (oscuro) { c.fillStyle = `rgba(10,2,4,${oscuro})`; c.fillRect(0, 0, W, H); }
  };
}
/** Recorte horizontal de una imagen: ella misma borrosa de fondo y el recorte nítido a lo ancho, con un zoom leve. */
function fondoRecorte(file, r, zoom = [1, 1.05]) {
  return async (c, t, d) => {
    const im = await img(file), z = zoom[0] + (zoom[1] - zoom[0]) * ease(clamp(t / d));
    const bh = H, bw = bh * r[2] / r[3];
    c.save(); c.filter = "blur(28px) brightness(0.6)"; c.drawImage(im, r[0], r[1], r[2], r[3], (W - bw) / 2, 0, bw, bh); c.restore();
    const fw = W * z, fh = fw * r[3] / r[2];
    c.drawImage(im, r[0], r[1], r[2], r[3], (W - fw) / 2, (H - fh) / 2 - 40, fw, fh);
  };
}
function degradado(c, arriba = true, abajo = true) {
  if (arriba) { const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, "rgba(10,2,4,.75)"); g.addColorStop(1, "rgba(10,2,4,0)"); c.fillStyle = g; c.fillRect(0, 0, W, 700); }
  if (abajo) { const g = c.createLinearGradient(0, H - 800, 0, H); g.addColorStop(0, "rgba(10,2,4,0)"); g.addColorStop(1, "rgba(10,2,4,.8)"); c.fillStyle = g; c.fillRect(0, H - 800, W, 800); }
}
/**
 * Texto de subtítulo: lineas = [[["texto", color], ...], ...]. Aparece con "pop" en t0 (segundos dentro de la escena).
 * Contorno negro grueso como los textos de TikTok; tamaño en px.
 */
function texto(c, lineas, y, t, { t0 = 0, size = 86, fondo = false } = {}) {
  const s = pop(t - t0); if (!s) return;
  c.save(); c.translate(W / 2, y); c.scale(s, s);
  c.font = `${size}px PBlack`; c.textBaseline = "middle"; c.lineJoin = "round";
  lineas.forEach((ln, li) => {
    const segs = ln.map(([tx, col]) => ({ tx, col: col || "#fff", w: c.measureText(tx).width }));
    const tw = segs.reduce((a, b) => a + b.w, 0), ly = (li - (lineas.length - 1) / 2) * size * 1.12;
    if (fondo) { c.fillStyle = "rgba(10,2,4,.72)"; const p = size * 0.28; c.beginPath(); c.roundRect(-tw / 2 - p, ly - size * 0.62, tw + p * 2, size * 1.2, size * 0.2); c.fill(); }
    let x = -tw / 2;
    for (const sg of segs) { c.lineWidth = size * 0.2; c.strokeStyle = "#0a0202"; c.strokeText(sg.tx, x, ly); c.fillStyle = sg.col; c.fillText(sg.tx, x, ly); x += sg.w; }
  });
  c.restore();
}
function imagenPop(c, im, cx, cy, ancho, t, t0 = 0) {
  const s = pop(t - t0); if (!s) return;
  const h = ancho * im.height / im.width;
  c.save(); c.translate(cx, cy); c.scale(s, s); c.drawImage(im, -ancho / 2, -h / 2, ancho, h); c.restore();
}
function destello(c, t) { if (t < 0.14) { c.fillStyle = `rgba(255,255,255,${0.55 * (1 - t / 0.14)})`; c.fillRect(0, 0, W, H); } }
let MARCA = null;
function marcaEsquina(c) { if (MARCA) { c.globalAlpha = 0.9; c.drawImage(MARCA, 60, 150, 250, 250 * MARCA.height / MARCA.width); c.globalAlpha = 1; } }

// ---------------------------------------------------------------- escenas comunes
const TITULOS = {};
function titulo(nombre, parts, o) { if (!TITULOS[nombre]) TITULOS[nombre] = wordmark(parts, o); return TITULOS[nombre]; }

function tarjetaFinal(d = 3.4) {
  return {
    d, sinMarca: true, dibujar: async (c, t) => {
      await fondoImagen(path.join(ROOT, "marca/banner-1920x1080.png"), [560, 0, 600], [640, 0, 560], 0.35)(c, t, d);
      degradado(c);
      const logo = titulo("logo", [{ text: "samp", pal: PAIRS.principal[0] }, { text: "city", pal: PAIRS.principal[1] }], { size: 300, depth: 26 });
      imagenPop(c, logo, W / 2, 620, 930, t, 0);
      texto(c, [[["ANDROID", ROSA], [" Y ", "#fff"], ["PC", ROJO]]], 900, t, { t0: 0.25, size: 92 });
      texto(c, [[["FASE BETA", AMARILLO], [" · ENTRA YA", "#fff"]]], 1030, t, { t0: 0.45, size: 64, fondo: true });
      texto(c, [[["Únete al Discord", "#fff"]], [[DISCORD, ROSA]]], 1260, t, { t0: 0.7, size: 66 });
      texto(c, [[["Link en la bio", "#fff"]]], 1440, t, { t0: 0.95, size: 50, fondo: true });
    },
  };
}

// ---------------------------------------------------------------- los videos
async function videos() {
  const dt = frames("dt", "dt.mp4", "scale=1080:1920"), ph = frames("ph", "ph.mp4", "scale=1080:1920"), pier = frames("pier", "pier.mp4", "scale=1080:1920");
  // zona.mp4: 1,5 a 15,5 s (antes y despues sale el escritorio). Recorte sin el chat (arriba a la izquierda).
  const zona = frames("zona", "zona.mp4", HORIZ("crop=820:570:390:150"), 1.5, 14);
  const INV = path.join(SRC, "inventario.jpg"), NEGRO = path.join(ROOT, "marca/banner-dinero-negro-1920x1080.png");
  const BETA = path.join(ROOT, "marca/banner-beta-1920x1080.png");
  const coin = await img(path.join(ROOT, "marca/citycoin.png"));

  return {
    // 1) presentación: gancho + lo mejor de todo en 20 s
    "1-presentacion": [
      { d: 2.6, dibujar: async (c, t, d) => { await fondoVideo(dt)(c, t, d); degradado(c); texto(c, [[["¿Buscas servidor de", "#fff"]], [["SA-MP", ROSA], [" para ", "#fff"], ["ANDROID", ROJO], ["?", "#fff"]]], 520, t, { size: 84 }); } },
      { d: 2.4, dibujar: async (c, t, d) => { await fondoVideo(ph)(c, t, d); degradado(c); const logo = titulo("logo", [{ text: "samp", pal: PAIRS.principal[0] }, { text: "city", pal: PAIRS.principal[1] }], { size: 300, depth: 26 }); texto(c, [[["Llegó", "#fff"]]], 430, t, { size: 80 }); imagenPop(c, logo, W / 2, 620, 900, t, 0.25); } },
      { d: 3.6, dibujar: async (c, t, d) => { await fondoVideo(zona, 5.5)(c, t, d); texto(c, [[["Policía, bandas", "#fff"]], [["y ", "#fff"], ["rol de verdad", ROSA]]], 330, t, { size: 84 }); } },
      { d: 3.2, dibujar: async (c, t, d) => { await fondoImagen(INV, [900, 290, 515], [1150, 300, 515])(c, t, d); degradado(c, true, false); texto(c, [[["Inventario", "#fff"]], [["100% propio", ROSA]]], 330, t, { size: 90 }); } },
      { d: 3.0, dibujar: async (c, t, d) => { await fondoImagen(NEGRO, [1380, 0, 540], [1370, 60, 530], 0.1)(c, t, d); degradado(c); texto(c, [[["¿Trabajo honrado", "#fff"]], [["o ", "#fff"], ["dinero negro", ROJO], ["?", "#fff"]]], 430, t, { size: 82 }); } },
      { d: 2.8, dibujar: async (c, t, d) => { await fondoVideo(pier)(c, t, d); degradado(c); texto(c, [[["14 trabajos", AMARILLO]], [["casas · negocios", "#fff"]], [["CityCoins", ROSA]]], 520, t, { size: 84 }); imagenPop(c, coin, W / 2, 900, 260, t, 0.35); } },
      tarjetaFinal(),
    ],

    // 2) acción: la escena de la policía con sus consecuencias
    "2-policia": [
      { d: 3.5, dibujar: async (c, t, d) => { await fondoVideo(zona, 0, [1, 1.04])(c, t, d); texto(c, [[["POV:", AMARILLO], [" estás en la", "#fff"]], [["zona segura", ROSA], [" de Pershing", "#fff"]]], 330, t, { size: 76 }); } },
      { d: 4.5, dibujar: async (c, t, d) => { await fondoVideo(zona, 3.5, [1.04, 1.08])(c, t, d); texto(c, [[["y alguien decide", "#fff"]], [["romper las reglas...", ROJO]]], 330, t, { size: 80 }); } },
      { d: 3.0, dibujar: async (c, t, d) => { await fondoVideo(zona, 8, [1.08, 1.16])(c, t, d); texto(c, [[["ataca a un", "#fff"]], [["POLICÍA", ROJO]]], 330, t, { size: 96 }); } },
      { d: 3.0, dibujar: async (c, t, d) => { await fondoVideo(zona, 11, [1.12, 1.2])(c, t, d); texto(c, [[["la policía se entera", "#fff"]], [["AL INSTANTE", AMARILLO]]], 330, t, { size: 84 }); texto(c, [[["y le cae ", "#fff"], ["búsqueda", ROJO]]], 1480, t, { t0: 0.5, size: 70, fondo: true }); } },
      tarjetaFinal(),
    ],

    // 3) inventario: recorrido por el panel
    "3-inventario": [
      { d: 2.4, dibujar: async (c, t, d) => { await fondoRecorte(INV, [780, 300, 1940, 924], [1.2, 1.4])(c, t, d); degradado(c); texto(c, [[["El inventario", "#fff"]], [["más limpio de", "#fff"]], [["SA-MP Android", ROSA]]], 470, t, { size: 84 }); } },
      { d: 3.2, dibujar: async (c, t, d) => { await fondoImagen(INV, [830, 330, 500], [870, 380, 450])(c, t, d); degradado(c, true, false); texto(c, [[["Ropa y accesorios", "#fff"]], [["cabeza · espalda · manos", ROSA]]], 300, t, { size: 66, fondo: true }); } },
      { d: 3.2, dibujar: async (c, t, d) => { await fondoImagen(INV, [1430, 330, 500], [1450, 380, 450])(c, t, d); degradado(c, true, false); texto(c, [[["Bolsillos", "#fff"], [" y ", "#fff"], ["mochila", ROSA]]], 300, t, { size: 74, fondo: true }); texto(c, [[["hasta el ", "#fff"], ["dinero negro", ROJO], [" ocupa sitio", "#fff"]]], 1500, t, { t0: 0.6, size: 54, fondo: true }); } },
      { d: 3.0, dibujar: async (c, t, d) => { await fondoImagen(INV, [1985, 680, 300], [1995, 690, 280])(c, t, d); texto(c, [[["USAR · DAR", "#fff"]], [["TRATO · TIRAR", ROSA]]], 1460, t, { size: 78, fondo: true }); } },
      { d: 2.8, dibujar: async (c, t, d) => { await fondoRecorte(INV, [830, 950, 560, 150], [1.05, 1.15])(c, t, d); texto(c, [[["Nivel, salud,", "#fff"]], [["comida y ", "#fff"], ["agua", "#4FB4FF"]]], 300, t, { size: 80, fondo: true }); } },
      tarjetaFinal(),
    ],

    // 4) cinemático: Los Santos desde el aire
    "4-los-santos": [
      { d: 4.6, dibujar: async (c, t, d) => { await fondoVideo(dt, 0, [1, 1.03])(c, t, d); degradado(c, true, false); texto(c, [[["Los Santos", "#fff"]], [["te está esperando", ROSA]]], 420, t, { t0: 0.4, size: 84 }); } },
      { d: 4.6, dibujar: async (c, t, d) => { await fondoVideo(ph, 0, [1, 1.03])(c, t, d); degradado(c, true, false); texto(c, [[["Tu historia", "#fff"]], [["empieza aquí", AMARILLO]]], 420, t, { t0: 0.3, size: 84 }); } },
      { d: 4.6, dibujar: async (c, t, d) => { await fondoVideo(pier, 0, [1, 1.03])(c, t, d); degradado(c); const logo = titulo("logo", [{ text: "samp", pal: PAIRS.principal[0] }, { text: "city", pal: PAIRS.principal[1] }], { size: 300, depth: 26 }); imagenPop(c, logo, W / 2, 560, 900, t, 0.5); } },
      tarjetaFinal(),
    ],

    // 5) trabajos y economía: lista rápida
    "5-trabajos": [
      { d: 2.4, dibujar: async (c, t, d) => { await fondoVideo(dt)(c, t, d); degradado(c); texto(c, [[["14 formas de", "#fff"]], [["ganar dinero", AMARILLO]], [["en SampCity", ROSA]]], 520, t, { size: 86 }); } },
      {
        d: 7.0, dibujar: async (c, t, d) => {
          await fondoVideo(ph)(c, t, d); c.fillStyle = "rgba(10,2,4,.35)"; c.fillRect(0, 0, W, H);
          const T = ["Camionero", "Taxista", "Mecánico", "Policía", "Médico", "Pizzero", "Basurero", "Leñador", "Granjero", "Cosechador", "Fumigador", "Carnicero", "Minero", "Gruero"];
          const k = Math.min(T.length - 1, Math.floor(t / (d / T.length)));
          texto(c, [[[String(k + 1).padStart(2, "0"), AMARILLO]]], 700, t, { t0: k * d / T.length, size: 120 });
          texto(c, [[[T[k].toUpperCase(), "#fff"]]], 860, t, { t0: k * d / T.length, size: 110 });
        },
      },
      { d: 3.0, dibujar: async (c, t, d) => { await fondoImagen(NEGRO, [1380, 0, 540], [1370, 60, 530], 0.1)(c, t, d); degradado(c); texto(c, [[["...o el ", "#fff"], ["dinero negro", ROJO]]], 430, t, { size: 84 }); texto(c, [[["tú decides", AMARILLO]]], 1480, t, { t0: 0.5, size: 80, fondo: true }); } },
      { d: 3.2, dibujar: async (c, t, d) => { await fondoVideo(pier)(c, t, d); degradado(c); texto(c, [[["Tutorial al empezar", "#fff"]], [["$5.000", AMARILLO], [" de regalo", "#fff"]]], 480, t, { size: 80 }); texto(c, [[["y paga cada hora", ROSA]]], 1480, t, { t0: 0.5, size: 70, fondo: true }); } },
      tarjetaFinal(),
    ],
  };
}

// ---------------------------------------------------------------- render
// MUESTRA=1: en vez del video, una imagen por escena (al 70 % de cada una) para revisar el diseño
async function muestra(nombre, escenas) {
  fs.mkdirSync(OUT, { recursive: true });
  const cv = createCanvas(W, H), c = cv.getContext("2d"), hoja = createCanvas(360 * escenas.length, 640), h = hoja.getContext("2d");
  for (const [i, esc] of escenas.entries()) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#0a0204"; c.fillRect(0, 0, W, H);
    await esc.dibujar(c, esc.d * 0.7, esc.d); if (!esc.sinMarca) marcaEsquina(c);
    h.drawImage(cv, i * 360, 0, 360, 640);
  }
  fs.writeFileSync(path.join(OUT, nombre + "-muestra.png"), hoja.toBuffer("image/png"));
  console.log("muestra", nombre);
}

async function render(nombre, escenas) {
  if (process.env.MUESTRA) return muestra(nombre, escenas);
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, nombre + ".mp4");
  const total = escenas.reduce((a, e) => a + e.d, 0), N = Math.round(total * FPS);
  const ff = spawn(FF, ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-f", "lavfi", "-t", String(total), "-i", "anullsrc=r=44100:cl=stereo", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const cv = createCanvas(W, H), c = cv.getContext("2d");
  let ini = 0, e = 0;
  for (let f = 0; f < N; f++) {
    const tg = f / FPS;
    while (e < escenas.length - 1 && tg >= ini + escenas[e].d) { ini += escenas[e].d; e++; }
    const esc = escenas[e], t = tg - ini;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#0a0204"; c.fillRect(0, 0, W, H);
    await esc.dibujar(c, t, esc.d);
    if (!esc.sinMarca) marcaEsquina(c);
    if (e > 0) destello(c, t);
    const px = c.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(px.buffer, px.byteOffset, px.byteLength))) await new Promise((r) => ff.stdin.once("drain", r));
    if (global.gc && f % 20 === 0) global.gc(); // las imagenes del canvas liberan memoria nativa solo al recolectarse
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`${path.relative(process.cwd(), out)}  ${total.toFixed(1)} s`);
}

(async () => {
  MARCA = await loadImage(path.join(ROOT, "marca/logo-plano.png"));
  const V = await videos();
  const pedidos = process.argv.slice(3);
  for (const [n, esc] of Object.entries(V)) if (!pedidos.length || pedidos.some((p) => n.includes(p))) await render(n, esc);
})().catch((e) => { console.error(e); process.exit(1); });
