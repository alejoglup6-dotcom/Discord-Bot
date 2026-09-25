// Captcha propio para el panel de verificación. Las letras se dibujan con líneas
// en vez de con una fuente: muchos hostings no tienen fuentes y el texto no se
// vería. Si canvas no se puede cargar, se usa un captcha de texto.

// Cada carácter son trazos sobre una cuadrícula de 4 x 6 (x, y; y hacia abajo)
const glyphs = {
  A: [[[0, 6], [2, 0], [4, 6]], [[1, 3.5], [3, 3.5]]],
  B: [[[0, 3], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3]]],
  C: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]],
  D: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 1], [3, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  J: [[[4, 0], [4, 5], [3, 6], [1, 6], [0, 5]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  P: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]],
  S: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 3], [3, 6], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
  2: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [0, 6], [4, 6]]],
  3: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]], [[1.5, 3], [3, 3]]],
  4: [[[3, 6], [3, 0], [0, 4], [4, 4]]],
  5: [[[4, 0], [0, 0], [0, 3], [3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
  6: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]]],
  7: [[[0, 0], [4, 0], [1, 6]]],
  8: [[[1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3]]],
  9: [[[4, 3], [1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5]]],
};

const chars = Object.keys(glyphs).join("");

function randomText(length = 6) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars[Math.floor(Math.random() * chars.length)];
  }
  return text;
}

function drawImage(value) {
  const { createCanvas } = require("canvas");
  const canvas = createCanvas(400, 150);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1e1f22";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Líneas de ruido
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 60%, 60%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Letras giradas, dibujadas trazo a trazo
  const scale = 10;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  [...value].forEach((char, i) => {
    ctx.save();
    ctx.translate(45 + i * 60, 75 + (Math.random() - 0.5) * 30);
    ctx.rotate((Math.random() - 0.5) * 0.6);
    ctx.translate(-2 * scale, -3 * scale);
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 80%, 75%)`;
    for (const stroke of glyphs[char]) {
      ctx.beginPath();
      stroke.forEach(([x, y], j) => {
        if (j === 0) ctx.moveTo(x * scale, y * scale);
        else ctx.lineTo(x * scale, y * scale);
      });
      ctx.stroke();
    }
    ctx.restore();
  });

  return canvas.toBuffer("image/jpeg");
}

module.exports = () => {
  const value = randomText();

  let image = null;
  try {
    image = drawImage(value);
  } catch (error) {
    console.log(`Captcha sin imagen (canvas no disponible): ${error.message}`);
  }

  return { value, image };
};
