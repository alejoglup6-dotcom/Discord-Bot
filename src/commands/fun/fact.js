const Discord = require("discord.js");
const axios = require("axios");
const translate = require("@iamtraction/google-translate");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const { data } = await axios.get(
    "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
  );

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
