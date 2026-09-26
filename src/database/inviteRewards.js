/*
 * Recompensas por invitaciones: dinero por cada invitado válido y niveles con rol + dinero
 * (configuración en src/assets/data/invites.js). Cada premio se entrega una sola vez.
 */
const config = require("../assets/data/invites");
const Log = require("./models/inviteRewardLog");
const Rewards = require("./models/inviteRewards");
const fortuna = require("./fortuna");

const DAY = 86400000;

// Marca un premio como entregado; devuelve false si ya estaba (atómico: dos entradas a la vez no pagan doble)
async function claim(guild, user, kind, key) {
  const before = await Log.findOneAndUpdate(
    { Guild: guild, User: user, Kind: kind, Key: String(key) },
    { $setOnInsert: { At: Date.now() } },
    { upsert: true },
  ).lean();
  return !before;
}

/**
 * Llamar cuando alguien entra con una invitación.
 * @param {import("discord.js").Guild} guild
 * @param {string} inviterId
 * @param {import("discord.js").GuildMember} member el que entró
 * @param {number} invites invitaciones actuales del que invitó
 * @returns {{ paid: number, tiers: object[], fake: boolean }}
 */
async function onInvite(guild, inviterId, member, invites) {
  const result = { paid: 0, tiers: [], fake: false };
  if (!inviterId || member.user.bot || inviterId === member.id) return result;

  const age = Date.now() - member.user.createdTimestamp;
  if (age < config.MIN_ACCOUNT_DAYS * DAY) {
    result.fake = true;
    return result;
  }

  if (config.PER_INVITE > 0 && (await claim(guild.id, inviterId, "invitee", member.id))) {
    await fortuna.addMoney(guild.id, inviterId, config.PER_INVITE);
    result.paid += config.PER_INVITE;
  }

  for (const tier of config.TIERS) {
    if (invites < tier.invites) continue;
    if (!(await claim(guild.id, inviterId, "tier", tier.invites))) continue;
    if (tier.money) {
      await fortuna.addMoney(guild.id, inviterId, tier.money);
      result.paid += tier.money;
    }
    const reward = await Rewards.findOne({ Guild: guild.id, Invites: tier.invites }).lean();
    const role = reward && guild.roles.cache.get(reward.Role);
    if (role) {
      const inviter = await guild.members.fetch(inviterId).catch(() => null);
      await inviter?.roles.add(role).catch(() => {});
    }
    result.tiers.push({ ...tier, roleId: role?.id });
  }
  return result;
}

module.exports = { onInvite, claim };
