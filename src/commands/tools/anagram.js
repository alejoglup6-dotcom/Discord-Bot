const Discord = require("discord.js");
const { pedirJson, errorApi } = require("../../assets/utils/apiExterna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const word = interaction.options.getString("word");

  let json;
  try {
    json = await pedirJson(`http://www.anagramica.com/all/${encodeURIComponent(word)}`);
  } catch (e) {
    return errorApi(client, interaction, e, "anagramas");
  }
  let content = ``;
  if (!json || !Array.isArray(json.all) || !json.all[0])
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
};
