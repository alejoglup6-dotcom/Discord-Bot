const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");
const { formatWait } = require("./work");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const r = await fortuna.heist(interaction.guild.id, interaction.user.id);

  if (r.error === "no_weapon")
    return client.errNormal({ error: "Necesitas un arma para asaltar. Mira /fortuna tienda armas", type: "editreply" }, interaction);
  if (r.error === "cooldown")
    return client.errNormal({ error: `Debes esperar ${formatWait(r.wait)} para volver a asaltar`, type: "editreply" }, interaction);

  if (r.success) {
    return client.embed(
      {
        title: "💰・Asalto exitoso",
        desc: `${interaction.user} asaltó ${r.target.name} con ${r.weapon.name} y se llevó **${catalog.money(r.loot)}**`,
        fields: [
          { name: "🎯┆Probabilidad", value: `${r.chance}%`, inline: true },
          { name: "💵┆Efectivo", value: catalog.money(r.money), inline: true },
        ],
        color: "#2ecc71",
        type: "editreply",
      },
      interaction,
    );
  }

  client.embed(
    {
      title: "🚓・Asalto fallido",
      desc: `La policía frustró el asalto de ${interaction.user} a ${r.target.name}` + (r.fine ? `. Multa: **${catalog.money(r.fine)}**` : ""),
      fields: [
        { name: "🎯┆Probabilidad", value: `${r.chance}%`, inline: true },
        { name: "💵┆Efectivo", value: catalog.money(r.money), inline: true },
      ],
      color: "#e74c3c",
      type: "editreply",
    },
    interaction,
  );
};
