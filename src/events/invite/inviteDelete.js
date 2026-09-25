const discord = require('discord.js');

module.exports = async (client, invite) => {
    const logsChannel = await client.getLogs(invite.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📨・Invitación eliminada`,
        desc: `Se eliminó una invitación`,
        fields: [
            {
                name: `> Código`,
                value: `- ${invite.code}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(invite.createdTimestamp / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};