const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const r = await fortuna.collect(interaction.guild.id, interaction.user.id);

  if (r.error === "no_income")
    return client.errNormal({ error: "No tienes casas, negocios ni empresas. Mira /fortuna tienda", type: "editreply" }, interaction);
  if (r.error === "nothing")
    return client.errNormal({ error: `Todavía no hay nada que cobrar (generas ${catalog.money(r.perHour)} por hora)`, type: "editreply" }, interaction);

  client.succNormal(
    {
      text: `📈 Cobraste **${catalog.money(r.total)}** de tus propiedades`,
      fields: [
        { name: "💵┆Efectivo", value: catalog.money(r.money), inline: true },
        { name: "⏱️┆Generas", value: `${catalog.money(r.perHour)} por hora (se acumula hasta ${catalog.MAX_INCOME_HOURS} h)`, inline: true },
      ],
      type: "editreply",
    },
    interaction,
  );
};
