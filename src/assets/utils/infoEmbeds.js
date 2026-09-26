/*
 * Mensajes de información que publica el bot: recompensas por invitación y la Fortuna.
 * Se usaron para 🎁┆recompensas-invitaciones y 💰┆info-fortuna; sirven para volver a publicarlos si cambian
 * los premios o el catálogo.
 */
const catalog = require("../data/fortuna");
const inviteConfig = require("../data/invites");

function base(client, title, color) {
  const e = client.templateEmbed().setTitle(title);
  if (color) e.setColor(color);
  return e;
}

function inviteEmbeds(client, guild, roles) {
  const m = catalog.money;
  const p = client.config.discord.prefix;
  const tiers = roles
    .map((r) => `${r.role ? `<@&${r.role.id}>` : `**${r.tier.role}**`} · **${r.tier.invites}** invitaciones → ${m(r.tier.money)}`)
    .join("\n");
  return [
    base(client, "🎁・Recompensas por invitar", "#ff7a59").setDescription(
      `¡Trae a tus amigos a **${guild.name}** y gana premios!\n\n` +
        `💵 **${m(inviteConfig.PER_INVITE)}** de la Fortuna por cada persona que entre con tu invitación.\n` +
        `🏆 Y al llegar a cada nivel ganas un **rol** y un **premio extra**:\n\n${tiers}`,
    ),
    base(client, "📨・Cómo invitar", "#5865F2").addFields(
      {
        name: "1️⃣┆Crea tu invitación",
        value: "Toca el nombre del servidor → **Invitar gente** → en ajustes pon que **no caduque** y copia el enlace.",
      },
      { name: "2️⃣┆Compártela", value: "En tus redes, con amigos que jueguen SA-MP o en grupos de GTA." },
      {
        name: "3️⃣┆Mira tu progreso",
        value: `\`/invitaciones ver\` · \`${p}invitaciones ver\`\nRanking: \`/invitaciones clasificacion\` · \`${p}invitaciones clasificacion\``,
      },
      {
        name: "⚠️┆Reglas",
        value:
          `• Solo cuentan las cuentas de Discord con más de **${inviteConfig.MIN_ACCOUNT_DAYS} días**.\n` +
          "• Si alguien sale, se descuenta de tus invitaciones (el dinero ya cobrado no se quita).\n" +
          "• Cada persona paga una sola vez, aunque salga y vuelva a entrar.\n" +
          "• Usar cuentas falsas o spam para invitar = pérdida de premios y sanción.",
      },
    ),
  ];
}

function fortunaEmbeds(client, guild, magnate, saved) {
  const m = catalog.money;
  const p = client.config.discord.prefix;
  const play = saved.FortunaChannel ? `${saved.FortunaChannel}` : "el canal de la Fortuna";
  const jobs = catalog.JOBS.map((j) => `${j.emoji} **${j.name}** ${m(j.pay[0])}-${m(j.pay[1])} · ${j.cooldown} min`).join("\n");
  const cat = (id) =>
    catalog.CATEGORIES[id].items
      .map((i) => `${i.name} · ${m(i.price)}${i.income ? ` (+${m(i.income)}/h)` : ""}${i.bonus ? ` (+${i.bonus}%)` : ""}`)
      .join("\n");
  const prizes = catalog.WEEKLY_PRIZES.map((v, i) => `${["🥇", "🥈", "🥉"][i]} ${m(v)}`).join("  ");
  return [
    base(client, "🕴️・La Fortuna", "#f5b041").setDescription(
      `El minijuego de economía de **${guild.name}**: trabaja, compra propiedades, cobra sus ganancias y sube en el ranking. ` +
        `Se juega en ${play} con \`/fortuna\` o con \`${p}\`.\n*(Es de Discord: no cambia nada dentro del juego.)*`,
    ).addFields(
      {
        name: "🚀┆Cómo empezar",
        value:
          `1. Mira los oficios: \`${p}trabajos\`\n2. Firma uno: \`${p}contrato policia\`\n3. Trabaja: \`${p}trabajar\`\n` +
          `4. Compra: \`${p}autos\` y \`${p}cauto sultan\`\n5. Cobra lo que generan tus casas y negocios: \`${p}cobrar\`\n6. Mira tu fortuna: \`${p}fortuna\``,
      },
      {
        name: "🏆┆Premios semanales",
        value:
          `Cada **domingo a las ${catalog.PRIZE_HOUR}:00** las 3 mayores fortunas cobran:\n${prizes}\n` +
          (magnate ? `El primero se lleva el rol <@&${magnate.id}> hasta el domingo siguiente.\n` : "") +
          `Ranking: \`/fortuna top\` · \`${p}fortuna top\``,
      },
    ),
    base(client, "👷・Oficios", "#5dade2").setDescription(
      `${jobs}\n\n🚗 Taxista, repartidor y camionero necesitan un **auto**. 🔫 Policía necesita un **arma**.`,
    ),
    base(client, "🏘️・Propiedades y armas", "#58d68d").addFields(
      { name: "🚗┆Autos", value: cat("autos"), inline: true },
      { name: "🏡┆Casas", value: cat("casas"), inline: true },
      { name: "🏪┆Negocios", value: cat("negocios"), inline: false },
      { name: "🏢┆Empresas", value: cat("empresas"), inline: true },
      { name: "🔫┆Armas", value: cat("armas"), inline: true },
      {
        name: "💡┆Datos",
        value:
          `• Las ganancias por hora se acumulan hasta ${catalog.MAX_INCOME_HOURS} h: cobra seguido.\n` +
          `• Al vender recuperas el ${Math.round(catalog.SELL_RATE * 100)}%.\n` +
          `• \`${p}asaltar\` cada ${catalog.HEIST_COOLDOWN} min: tu mejor arma sube la probabilidad; si fallas, multa.`,
      },
    ),
  ];
}

module.exports = { inviteEmbeds, fortunaEmbeds };
