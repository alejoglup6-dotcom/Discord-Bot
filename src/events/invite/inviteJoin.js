const discord = require('discord.js');

const invites = require("../../database/models/invites");
const invitedBy = require("../../database/models/inviteBy");
const { onInvite } = require("../../database/inviteRewards");
const { sendWelcome } = require("../../assets/utils/welcome");

/**
 * Alguien entró al servidor (lo emite inviteTracker con la invitación que usó).
 * @param {import('../../typings.d').Client} client
 * @param {discord.GuildMember} member
 * @param {discord.Invite} invite
 * @param {discord.User} inviter
 */
module.exports = async (client, member, invite, inviter) => {
    if (member.user.bot) return;
    let inviteData = null;
    let reward = null;

    if (invite && inviter && inviter.id !== member.id) {
        // Suma atómica: dos entradas a la vez no se pisan
        inviteData = await invites.findOneAndUpdate(
            { Guild: member.guild.id, User: inviter.id },
            { $inc: { Invites: 1, Total: 1 }, $setOnInsert: { Left: 0 } },
            { upsert: true, new: true },
        ).lean();

        // Quién invitó a quién (una fila por miembro)
        await invitedBy.findOneAndUpdate(
            { Guild: member.guild.id, User: member.id },
            { $set: { inviteUser: inviter.id } },
            { upsert: true },
        );

        reward = await onInvite(member.guild, inviter.id, member, inviteData.Invites).catch(() => null);
    }

    await sendWelcome(client, member, { inviter: invite ? inviter : null, invites: inviteData, reward });
};
