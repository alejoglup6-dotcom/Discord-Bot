const { pedirJson } = require("../../assets/utils/apiExterna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  // "#FF0000", "ff0000" o "f00" -> "ff0000"
  let color = String(interaction.options.getString("color") || "").trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(color)) color = color.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/.test(color)) {
    return client.errNormal({ error: "Ese color no es válido. Escríbelo en hexadecimal, ej. #E8392F", type: "editreply" }, interaction);
  }
  // el RGB se calcula aqui; la API solo da la muestra del color (si no contesta, se muestra sin imagen)
  const r = parseInt(color.slice(0, 2), 16), g = parseInt(color.slice(2, 4), 16), b = parseInt(color.slice(4, 6), 16);
  let nombre = null;
  try {
    const d = await pedirJson(`https://api.popcat.xyz/color/${color}`, { intentos: 1, timeout: 8000 });
    nombre = d && d.name ? d.name : null;
  } catch {
    /* sin nombre */
  }
  return client.embed(
    {
      title: `🎨・Información del color`,
      image: `https://some-random-api.com/canvas/colorviewer?hex=${color}`,
      color: `#${color}`,
      fields: [
        { name: "Hex", value: `#${color}`, inline: true },
        { name: "RGB", value: `${r}, ${g}, ${b}`, inline: true },
        ...(nombre ? [{ name: "Nombre", value: nombre, inline: true }] : []),
      ],
      type: "editreply",
    },
    interaction,
  );
};
