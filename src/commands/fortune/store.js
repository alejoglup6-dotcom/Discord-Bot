const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const category = catalog.findCategory(interaction.options.getString("category"));
  if (!category)
    return client.errNormal({ error: "Categorías: autos, casas, negocios, empresas, armas", type: "editreply" }, interaction);

  const lines = category.items.map((i) => {
    let extra = "";
    if (i.income) extra = ` · genera ${catalog.money(i.income)}/h`;
    if (i.bonus) extra = ` · +${i.bonus}% al asaltar`;
    return `**${i.name}** · ${catalog.money(i.price)}${extra}`;
  });

  client.embed(
    {
      title: `${category.emoji}・${category.name}`,
      desc:
        `${lines.join("\n")}\n\n` +
        `Compra con \`/fortuna comprar\` o \`!comprar ${category.id} <nombre>\`. ` +
        `Al vender recuperas el ${Math.round(catalog.SELL_RATE * 100)}%.`,
      type: "editreply",
    },
    interaction,
  );
};
