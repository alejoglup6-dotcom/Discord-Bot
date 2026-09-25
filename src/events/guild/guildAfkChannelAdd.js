const Discord = require('discord.js');

module.exports = async (client, guild, afkChannel) => {
    const logsChannel = await client.getLogs(guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🛑・Nuevo canal AFK`,
        desc: `Se añadió un canal AFK al servidor`,
        fields: [
            {
                name: `> Canal`,
                value: `- ${afkChannel}`
            },
            {
                name: `> Nombre`,
                value: `- ${afkChannel.name}`
            },
            {
                name: `> ID`,
                value: `- ${afkChannel.id}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(afkChannel.createdTimestamp / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};