const Discord = require('discord.js');

module.exports = async (client, guild, url) => {
    const logsChannel = await client.getLogs(guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔗・Nueva URL personalizada`,
        desc: `Se actualizó la URL personalizada del servidor`,
        fields: [
            {
                name: `> URL`,
                value: `- ${url}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};