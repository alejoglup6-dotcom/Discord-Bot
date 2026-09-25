const discord = require('discord.js');

module.exports = async (client, user, mod) => {
    const logsChannel = await client.getLogs(user.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔨・Advertencia retirada`,
        desc: `Se retiró una advertencia a un usuario`,
        fields: [
            {
                name: `> Usuario`,
                value: `- ${user}`
            },
            {
                name: `> Tag`,
                value: `- ${user.user.username}#${user.user.discriminator}`
            },
            {
                name: `> ID`,
                value: `${user.id}`
            },
            {
                name: `> Moderador`,
                value: `${mod} (${mod.id})`
            }
        ]
    }, logsChannel).catch(() => { })
};