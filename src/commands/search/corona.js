const Discord = require("discord.js");
const fetch = require("node-fetch");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let countries = interaction.options.getString("country");

  fetch(`https://covid19.mathdro.id/api/countries/${countries}`)
    .then((response) => response.json())
    .then((data) => {
      let confirmed = data.confirmed.value.toLocaleString();
      let recovered = data.recovered.value.toLocaleString();
      let deaths = data.deaths.value.toLocaleString();

      return client.embed(
        {
          title: `💉・COVID-19 - ${countries}`,
          fields: [
            {
              name: "✅┇Casos confirmados",
              value: `${confirmed}`,
              inline: true,
            },
            {
              name: "🤗┇Recuperados",
              value: `${recovered}`,
              inline: true,
            },
            {
              name: "💀┇Muertes",
              value: `${deaths}`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    })
    .catch((e) => {
      return client.errNormal(
        { error: `¡El país indicado no es válido!`, type: "editreply" },
        interaction,
      );
    });
};
