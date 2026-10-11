const { pedirJson, errorApi } = require("../../assets/utils/apiExterna");

// Fondos de pantalla de wallhaven.cc (solo aptos para todo público, sin clave). Antes el comando estaba vacío y no respondía.
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const query = String(interaction.options.getString("name") || "").trim().slice(0, 80);
  if (!query) return client.errUsage({ usage: "wallpaper [nombre]", type: "editreply" }, interaction);

  try {
    const url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&purity=100&categories=111&sorting=relevance&atleast=1280x720`;
    const json = await pedirJson(url);
    const lista = (json && Array.isArray(json.data) ? json.data : []).filter((w) => w && w.path && w.purity === "sfw");
    if (!lista.length) return client.errNormal({ error: `No encontré fondos de pantalla para "${query}". Prueba con otra palabra (mejor en inglés).`, type: "editreply" }, interaction);
    const w = lista[Math.floor(Math.random() * Math.min(lista.length, 12))];
    return client.embed(
      {
        title: `🖼・Fondo de pantalla: ${query}`.slice(0, 256),
        desc: `${w.resolution || ""} · [Descargar](${w.path})`,
        image: w.path,
        type: "editreply",
      },
      interaction,
    );
  } catch (e) {
    return errorApi(client, interaction, e, "el fondo de pantalla");
  }
};
