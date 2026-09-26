const Discord = require("discord.js");
const moment = require("moment-timezone");

const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");
const Layout = require("../../database/models/serverLayout");
const { configuredOrNamed, roleByName } = require("../../assets/utils/guildLookup");

function fortunaChannel(guild, layout) {
  return configuredOrNamed(guild, layout?.FortunaChannel, /^fortuna$/);
}
function magnateRole(guild, layout) {
  return (layout?.MagnateRole && guild.roles.cache.get(layout.MagnateRole)) || roleByName(guild, catalog.MAGNATE_ROLE);
}

/*
 * Premios semanales de la Fortuna (src/assets/data/fortuna.js: WEEKLY_PRIZES, PRIZE_DAY, PRIZE_HOUR).
 * Cada 5 minutos mira si ya pasó el último domingo a las 20:00 (FORTUNA_TZ) y si ese premio no se entregó:
 * paga al top 3, pasa el rol "Magnate de la semana" al primero y lo anuncia en el canal de la Fortuna.
 * Solo en servidores que tienen un canal "fortuna" y el rol "💰 Magnate de la semana" (así se activa).
 */
const TZ = () => process.env.FORTUNA_TZ || "America/Mexico_City";

// Fecha del último reparto (el domingo a las 20:00 más reciente); sirve de clave para no pagar dos veces
function lastPrizeKey(now = Date.now()) {
  const t = moment(now).tz(TZ());
  const prize = t.clone().day(catalog.PRIZE_DAY).hour(catalog.PRIZE_HOUR).minute(0).second(0).millisecond(0);
  if (prize.isAfter(t)) prize.subtract(7, "days");
  return prize.format("YYYY-MM-DD");
}

async function awardWeek(client, guild, key) {
  // Reserva atómica: si dos procesos del bot llegan a la vez, solo uno reparte
  const res = await Layout.updateOne({ Guild: guild.id, LastPrizeWeek: { $ne: key } }, { $set: { LastPrizeWeek: key } });
  if (!res.modifiedCount) return null;

  const layout = await Layout.findOne({ Guild: guild.id }).lean();
  const role = magnateRole(guild, layout);
  const channel = fortunaChannel(guild, layout);
  const top = (await fortuna.leaderboard(guild.id, 10)).filter((u) => !guild.members.cache.get(u.user)?.user.bot);
  const winners = top.slice(0, catalog.WEEKLY_PRIZES.length);
  for (const [i, w] of winners.entries()) await fortuna.addMoney(guild.id, w.user, catalog.WEEKLY_PRIZES[i]);

  // Rol del magnate: solo para el primero
  if (role && winners[0]) {
    for (const m of role.members.values()) if (m.id !== winners[0].user) await m.roles.remove(role).catch(() => {});
    const first = await guild.members.fetch(winners[0].user).catch(() => null);
    await first?.roles.add(role).catch(() => {});
  }

  if (channel && winners.length) {
    const medals = ["🥇", "🥈", "🥉"];
    await client
      .embed(
        {
          title: "🏆・Premios semanales de la Fortuna",
          desc:
            winners
              .map((w, i) => `${medals[i]} <@${w.user}> · fortuna de **${catalog.money(w.total)}** → gana **${catalog.money(catalog.WEEKLY_PRIZES[i])}**`)
              .join("\n") +
            (role ? `\n\n${role} de la semana: <@${winners[0].user}>` : "") +
            `\n\nEl próximo domingo a las ${catalog.PRIZE_HOUR}:00 hay más premios. Mira el ranking con \`!fortuna top\`.`,
          content: winners.map((w) => `<@${w.user}>`).join(" "),
        },
        channel,
      )
      .catch(() => {});
  }
  return winners;
}

module.exports = (client) => {
  async function check() {
    const key = lastPrizeKey();
    for (const guild of client.guilds.cache.values()) {
      try {
        const layout = await Layout.findOne({ Guild: guild.id }).lean();
        if (!fortunaChannel(guild, layout) || !magnateRole(guild, layout)) continue;
        // La primera vez solo se anota la fecha: el primer reparto es el próximo domingo
        if (!layout?.LastPrizeWeek) {
          await Layout.findOneAndUpdate({ Guild: guild.id }, { $set: { LastPrizeWeek: key } }, { upsert: true });
          continue;
        }
        if (layout.LastPrizeWeek !== key) await awardWeek(client, guild, key);
      } catch (e) {
        console.log(e);
      }
    }
  }
  client.once(Discord.Events.ClientReady, () => {
    setTimeout(check, 30000);
    setInterval(check, 5 * 60000);
  });
};
module.exports.lastPrizeKey = lastPrizeKey;
module.exports.awardWeek = awardWeek;
