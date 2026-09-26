const discord = require('discord.js');

const invitedBy = require("../../database/models/inviteBy");
const invites = require("../../database/models/invites");
const { sendLeave } = require("../../assets/utils/welcome");

module.exports = async (client, member) => {
    if (member.user?.bot) return;
    const inviteByData = await invitedBy.findOne({ Guild: member.guild.id, User: member.id }).lean();

    let inviteData = null;
    if (inviteByData) {
        // El que lo invitó pierde esa invitación (queda como "salió")
        inviteData = await invites.findOneAndUpdate(
            { Guild: member.guild.id, User: inviteByData.inviteUser },
            { $inc: { Invites: -1, Left: 1 } },
            { new: true },
        ).lean();
    }

    await sendLeave(client, member, { inviterId: inviteByData?.inviteUser, invites: inviteData });
};
