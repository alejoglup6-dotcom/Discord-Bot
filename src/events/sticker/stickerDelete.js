const discord = require('discord.js');

module.exports = async (client, sticker) => {
    const logsChannel = await client.getLogs(sticker.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😜・Sticker eliminado`,
        desc: `Se eliminó un sticker`,
        fields: [
            {
                name: `> Nombre`,
                value: `- ${sticker.name}`
            },
            {
                name: `> ID`,
                value: `- ${sticker.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};