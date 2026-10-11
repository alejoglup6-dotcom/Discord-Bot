const Discord = require("discord.js");
const axios = require("axios");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let coin = String(interaction.options.getString("coin") || "").trim().toLowerCase();
  let currency = String(interaction.options.getString("currency") || "").trim().toLowerCase();

  try {
    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=${encodeURIComponent(currency)}`,
      { timeout: 12000 },
    );

    if (!data || !data[coin] || data[coin][currency] == null) {
      return client.errNormal({ error: `No encontré **${coin}** en **${currency}**. Usa el id de CoinGecko (ej. bitcoin, ethereum) y una moneda (usd, eur, mxn).`, type: "editreply" }, interaction);
    }

    client.embed(
      {
        title: `💹・Estadísticas cripto`,
        desc: `El precio actual de **1 ${coin}** = **${data[coin][currency]} ${currency}**`,
        type: "editreply",
      },
      interaction,
    );
  } catch {
    client.errNormal(
      {
        error: "No pude consultar el precio (CoinGecko no contestó o limitó las consultas). Prueba de nuevo en un rato.",
        type: "editreply",
      },
      interaction,
    );
  }
};
