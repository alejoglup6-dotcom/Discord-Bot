const path = require("path");

// Captcha propio para el panel de verificación. Si canvas no se puede cargar en
// el servidor, se usa un captcha de texto para que el bot siga funcionando.
const chars = "ABCDEFHJLMNPSTUVWXYZ23456789";

function randomText(length = 6) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars[Math.floor(Math.random() * chars.length)];
  }
  return text;
}

let fontRegistered = false;

function drawImage(value) {
  const { createCanvas, registerFont } = require("canvas");

  // Muchos hostings no tienen fuentes instaladas y el texto no se vería,
  // así que se usa una fuente incluida en el bot (Manrope, licencia OFL)
  if (!fontRegistered) {
    registerFont(path.join(__dirname, "../fonts/Manrope-Bold.ttf"), {
      family: "CaptchaFont",
    });
    fontRegistered = true;
  }
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

  // Letras giradas
  ctx.font = "56px CaptchaFont";
  ctx.textBaseline = "middle";
  [...value].forEach((char, i) => {
    ctx.save();
    ctx.translate(40 + i * 58, 75 + (Math.random() - 0.5) * 30);
    ctx.rotate((Math.random() - 0.5) * 0.6);
    ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 75%)`;
    ctx.fillText(char, 0, 0);
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
