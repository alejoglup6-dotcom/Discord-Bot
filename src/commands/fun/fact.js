const Discord = require("discord.js");
const axios = require("axios");
const translate = require("@iamtraction/google-translate");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let data;
  try {
    ({ data } = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en", { timeout: 12000 }));
  } catch (e) {
    return client.errNormal({ error: "No pude traer un dato: el servicio externo no contestó. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }
  if (!data || !data.text) return client.errNormal({ error: "No pude traer un dato. Prueba de nuevo en un rato.", type: "editreply" }, interaction);

  // La API solo da datos en inglés; si la traducción falla se muestra el original
  const fact = await translate(data.text, { to: "es" })
    .then((res) => res.text)
    .catch(() => data.text);

  client.embed(
    {
      title: `😂・Dato`,
      desc: fact,
      type: "editreply",
    },
    interaction,
  );
};
