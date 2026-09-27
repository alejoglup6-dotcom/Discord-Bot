const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const r = await fortuna.sell(
    interaction.guild.id,
    interaction.user.id,
    interaction.options.getString("category"),
    interaction.options.getString("item"),
  );

  if (r.error === "no_category")
    return client.errNormal({ error: "Categorías: autos, casas, negocios, empresas, armas", type: "editreply" }, interaction);
  if (r.error === "no_item")
    return client.errNormal({ error: `Ese artículo no está en ${r.category.name.toLowerCase()}`, type: "editreply" }, interaction);
  if (r.error === "not_owned") return client.errNormal({ error: `No tienes ${r.item.name}`, type: "editreply" }, interaction);

  client.succNormal(
    {
      text:
        `${r.category.emoji} Vendiste **${r.item.name}** por **${catalog.money(r.price)}**` +
        (r.pending ? ` y cobraste **${catalog.money(r.pending)}** que tenía acumulado` : ""),
      fields: [{ name: "💵┆Efectivo", value: catalog.money(r.money), inline: true }],
      type: "editreply",
    },
    interaction,
  );
};
