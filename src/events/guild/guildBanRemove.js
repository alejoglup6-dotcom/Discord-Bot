const discord = require('discord.js');

module.exports = async (client, ban) => {
    const logsChannel = await client.getLogs(ban.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔧・Miembro desbaneado`,
        desc: `Se desbaneó a un usuario`,
        thumbnail: ban.user.avatarURL({ size: 4096 }),
        fields: [
            {
                name: `> Usuario`,
                value: `- ${ban.user}`
            },
            {
                name: `> Tag`,
                value: `- ${ban.user.tag}`
            },
            {
                name: `> ID`,
                value: `- ${ban.user.id}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(ban.createdTimestamp / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};