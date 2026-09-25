const Discord = require("discord.js");
const fetch = require("node-fetch");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const word = interaction.options.getString("word");

  fetch(`http://www.anagramica.com/all/${encodeURIComponent(word)}`)
    .then((res) => res.json())
    .catch({})
    .then(async (json) => {
      let content = ``;
      if (!json.all[0])
        return client.errNormal(
          { error: "¡No se encontró ninguna palabra!", type: "editreply" },
          interaction,
        );

      json.all.forEach((i) => {
        content += `${i}\n`;
      });

      client.embed(
        {
          title: `❓・Anagrama`,
          desc: `Formé una palabra con las letras indicadas`,
          fields: [
            {
              name: `💬┇Palabra(s)`,
              value: content,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    })
    .catch({});
};
