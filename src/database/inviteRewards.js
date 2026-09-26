/*
 * Recompensas por invitaciones: dinero por cada invitado válido y niveles con rol + dinero
 * (configuración en src/assets/data/invites.js). Cada premio se entrega una sola vez.
 *
 * Invitado válido = cuenta de Discord con al menos MIN_ACCOUNT_DAYS días al entrar y que sigue en el servidor.
 * Los niveles cuentan SOLO invitados válidos: es la medida contra las multicuentas recién creadas.
 */
const config = require("../assets/data/invites");
const Log = require("./models/inviteRewardLog");
const InviteBy = require("./models/inviteBy");
const Rewards = require("./models/inviteRewards");
const fortuna = require("./fortuna");
const { roleByName } = require("../assets/utils/guildLookup");

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

function isValidAccount(user) {
  return Date.now() - user.createdTimestamp >= config.MIN_ACCOUNT_DAYS * DAY;
}

// Invitados válidos que siguen en el servidor
async function validInvites(guildId, inviterId) {
  return InviteBy.countDocuments({ Guild: guildId, inviteUser: inviterId, Valid: true, Active: true });
}

// Invitados válidos por cada miembro del servidor (para la tabla de 🔔┆invitados)
async function validInvitesByUser(guildId) {
  const rows = await InviteBy.find({ Guild: guildId, Valid: true, Active: true }).lean();
  const counts = new Map();
  for (const r of rows) counts.set(r.inviteUser, (counts.get(r.inviteUser) || 0) + 1);
  return counts;
}

/**
 * Llamar cuando alguien entra con una invitación (después de guardar quién lo invitó en inviteBy).
 * @param {import("discord.js").Guild} guild
 * @param {string} inviterId
 * @param {import("discord.js").GuildMember} member el que entró
 * @returns {{ paid: number, tiers: object[], fake: boolean, valid: number }}
 */
async function onInvite(guild, inviterId, member) {
  const result = { paid: 0, tiers: [], fake: false, valid: 0 };
  if (!inviterId || member.user.bot || inviterId === member.id) return result;

  result.fake = !isValidAccount(member.user);
  if (!result.fake && config.PER_INVITE > 0 && (await claim(guild.id, inviterId, "invitee", member.id))) {
    await fortuna.addMoney(guild.id, inviterId, config.PER_INVITE);
    result.paid += config.PER_INVITE;
  }

  // Niveles: solo invitados válidos que siguen en el servidor
  result.valid = await validInvites(guild.id, inviterId);
  for (const tier of config.TIERS) {
    if (result.valid < tier.invites) continue;
    if (!(await claim(guild.id, inviterId, "tier", tier.invites))) continue;
    if (tier.money) {
      await fortuna.addMoney(guild.id, inviterId, tier.money);
      result.paid += tier.money;
    }
    // Rol configurado para ese nivel o, si no, el que tenga el nombre del nivel
    const reward = await Rewards.findOne({ Guild: guild.id, Invites: tier.invites }).lean();
    const role = (reward && guild.roles.cache.get(reward.Role)) || roleByName(guild, tier.role);
    if (role) {
      const inviter = await guild.members.fetch(inviterId).catch(() => null);
      await inviter?.roles.add(role).catch(() => {});
    }
    result.tiers.push({ ...tier, roleId: role?.id });
  }
  return result;
}

module.exports = { onInvite, claim, isValidAccount, validInvites, validInvitesByUser };
