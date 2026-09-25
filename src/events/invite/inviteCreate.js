const discord = require('discord.js');

/**
 * 
 * @param {import('../../typings.d').Client} client 
 * @param {discord.Invite} invite 
 * @returns 
 */
module.exports = async (client, invite) => {
    const logsChannel = await client.getLogs(invite.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📨・Invitación creada`,
        desc: `Se creó una invitación`,
        fields: [
            {
                name: `> Código`,
                value: `- ${invite.code}`
            },
            {
                name: `> Invitado por`,
                value: invite.inviter ? `- ${invite.inviter} (${invite.inviter.tag})` : `- Desconocido`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(invite.createdTimestamp / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};