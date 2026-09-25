const discord = require('discord.js');

module.exports = async (client, sticker) => {
    const logsChannel = await client.getLogs(sticker.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😜・Sticker creado`,
        desc: `Se creó un sticker`,
        fields: [
            {
                name: `> Nombre`,
                value: `- ${sticker.name}`
            },
            {
                name: `> ID`,
                value: `- ${sticker.id}`
            },
            {
                name: `> URL`,
                value: `${sticker.url}`
            }
        ]
    }, logsChannel).catch(() => { })
};