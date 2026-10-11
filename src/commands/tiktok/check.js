const tiktokVideos = require("../../database/models/tiktokVideos");

/**
 * Revisa ahora mismo la cuenta oficial (lo mismo que la vuelta de cada 10 min) y cuenta qué pasó.
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const tools = client.tiktokTools;
  if (!client.checkTikTok || !client.tiktokEstado) {
    return client.errNormal({ error: "El módulo de TikTok no está cargado en el bot.", type: "editreply" }, interaction);
  }

  const posted = await client.checkTikTok();
  const e = client.tiktokEstado;
  const hora = (t) => (t ? `<t:${Math.floor(t / 1000)}:R>` : "nunca");

  if (e.error && e.at > e.okAt) {
    return client.errNormal(
      {
        error: `No pude leer @${tools.mainUser}: ${e.error}.\nÚltima lectura buena: ${hora(e.okAt)}. El bot lo reintenta solo en 2 min.`,
        type: "editreply",
      },
      interaction,
    );
  }

  let ultimo = "La cuenta no tiene videos públicos.";
  if (e.ultimo) {
    const ya = await tiktokVideos.findOne({ Guild: interaction.guild.id, Video: e.ultimo.id });
    ultimo = `[${(e.ultimo.desc || "Sin descripción").slice(0, 80)}](https://www.tiktok.com/@${tools.mainUser}/video/${e.ultimo.id})\n${ya ? "✅ Ya está anunciado en el canal." : "⚠️ No está anunciado: revisa que exista el canal de texto «tiktok» y que el bot pueda escribir ahí."}`;
  }
  return client.succNormal(
    {
      text: `Leí ${e.leidos} videos de @${tools.mainUser}: ${posted} anunciados ahora.`,
      fields: [{ name: "🎵┆Video más reciente", value: ultimo }],
      type: "editreply",
    },
    interaction,
  );
};
