const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user") || interaction.user;
  if (user.bot) return client.errNormal({ error: "Los bots no tienen fortuna", type: "editreply" }, interaction);

  const o = await fortuna.overview(interaction.guild.id, user.id);
  const m = catalog.money;
  const c = catalog.CATEGORIES;

  const owned = (cat) => {
    const names = o.assets.filter((a) => a.Category === cat).map((a) => catalog.getItem(cat, a.Item)?.name || a.Item);
    return names.length ? names.join(", ") : "Ninguno";
  };

  client.embed(
    {
      title: `🕴️・Fortuna de ${user.username}`,
      thumbnail: user.displayAvatarURL({ size: 256 }),
      fields: [
        { name: "💰┆Capital", value: `💵 Efectivo **${m(o.money)}**\n🏦 Banco **${m(o.bank)}**`, inline: true },
        {
          name: "👷┆Oficio",
          value: o.job ? `${o.job.emoji} ${o.job.name}\n${o.shifts} turnos · ${m(o.earned)}` : "Sin contrato",
          inline: true,
        },
        {
          name: "🏘️┆Propiedades",
          value:
            `${c.autos.emoji} Autos **${o.counts.autos}**  ${c.casas.emoji} Casas **${o.counts.casas}**\n` +
            `${c.negocios.emoji} Negocios **${o.counts.negocios}**  ${c.empresas.emoji} Empresas **${o.counts.empresas}**\n` +
            `${c.armas.emoji} Armas **${o.counts.armas}**`,
        },
        { name: `${c.autos.emoji}┆Autos`, value: owned("autos"), inline: true },
        { name: `${c.casas.emoji}┆Casas`, value: owned("casas"), inline: true },
        { name: `${c.negocios.emoji}┆Negocios`, value: owned("negocios"), inline: true },
        { name: `${c.empresas.emoji}┆Empresas`, value: owned("empresas"), inline: true },
        { name: `${c.armas.emoji}┆Armas`, value: owned("armas"), inline: true },
        {
          name: "📈┆Ganancias",
          value: `${m(o.incomePerHour)} por hora\n${m(o.pending)} sin cobrar`,
          inline: true,
        },
        { name: "📄┆Resumen", value: `Fortuna de **${user.username}** valorada en **${m(o.total)}**` },
      ],
      type: "editreply",
    },
    interaction,
  );
};
