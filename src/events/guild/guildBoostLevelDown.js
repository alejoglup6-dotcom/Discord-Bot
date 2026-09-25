const Discord = require('discord.js');

module.exports = async (client, guild, oldLevel, newLevel) => {
    const logsChannel = await client.getLogs(guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🆙・Nuevo nivel de boost`,
        desc: `Este servidor volvió a un nivel de boost anterior`,
        fields: [
            {
                name: `> Nivel anterior`,
                value: `- ${oldLevel}`
            },
            {
                name: `> Nivel nuevo`,
                value: `- ${newLevel}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};