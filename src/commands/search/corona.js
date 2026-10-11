const { pedirJson, errorApi } = require("../../assets/utils/apiExterna");

// La API de antes (covid19.mathdro.id) dejo de existir: se usa disease.sh (datos de Worldometers y Johns Hopkins).
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const country = String(interaction.options.getString("country") || "").trim();
  if (!country) return client.errNormal({ error: "Escribe un país (en inglés o su código, ej. mexico, MX, spain).", type: "editreply" }, interaction);

  let data;
  try {
    data = await pedirJson(`https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}?strict=false`);
  } catch (e) {
    if (e.status === 404) return client.errNormal({ error: `No encontré el país "${country}". Prueba en inglés o con su código (ej. mexico, MX).`, type: "editreply" }, interaction);
    return errorApi(client, interaction, e, "los datos de COVID-19");
  }
  const n = (x) => (typeof x === "number" ? x.toLocaleString("es-ES") : "—");
  return client.embed(
    {
      title: `💉・COVID-19 - ${data.country || country}`,
      thumbnail: data.countryInfo && data.countryInfo.flag ? data.countryInfo.flag : undefined,
      fields: [
        { name: "✅┇Casos confirmados", value: n(data.cases), inline: true },
        { name: "🤗┇Recuperados", value: n(data.recovered), inline: true },
        { name: "💀┇Muertes", value: n(data.deaths), inline: true },
      ],
      type: "editreply",
    },
    interaction,
  );
};
