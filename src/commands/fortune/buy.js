const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const r = await fortuna.buy(
    interaction.guild.id,
    interaction.user.id,
    interaction.options.getString("category"),
    interaction.options.getString("item"),
  );

  if (r.error === "no_category")
    return client.errNormal({ error: "Categorías: autos, casas, negocios, empresas, armas", type: "editreply" }, interaction);
  if (r.error === "no_item")
    return client.errNormal({ error: `Ese artículo no está en ${r.category.name.toLowerCase()}. Mira /fortuna tienda`, type: "editreply" }, interaction);
  if (r.error === "owned") return client.errNormal({ error: `Ya tienes ${r.item.name}`, type: "editreply" }, interaction);
  if (r.error === "no_money")
    return client.errNormal(
      { error: `Dinero insuficiente: ${r.item.name} cuesta ${catalog.money(r.item.price)} y te faltan ${catalog.money(r.missing)} en efectivo`, type: "editreply" },
      interaction,
    );

  let extra = "";
  if (r.item.income) extra = `\nGenera **${catalog.money(r.item.income)}** por hora: cóbralo con \`!cobrar\``;
  if (r.item.bonus) extra = `\n+${r.item.bonus}% de éxito al asaltar con \`!asaltar\``;
  client.succNormal(
    {
      text: `${r.category.emoji} Compraste **${r.item.name}** por **${catalog.money(r.item.price)}**${extra}`,
      fields: [{ name: "💵┆Efectivo", value: catalog.money(r.money), inline: true }],
      type: "editreply",
    },
    interaction,
  );
};
