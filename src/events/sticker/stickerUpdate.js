const discord = require('discord.js');

module.exports = async (client, oldSticker, newSticker) => {
    const logsChannel = await client.getLogs(newSticker.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😜・Sticker actualizado`,
        desc: `Se actualizó un sticker`,
        fields: [
            {
                name: `> Antes`,
                value: `- ${oldSticker.name}`
            },
            {
                name: `> Después`,
                value: `- ${newSticker.name}`
            },
            {
                name: `> ID`,
                value: `- ${newSticker.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};