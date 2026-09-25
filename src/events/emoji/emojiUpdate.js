const discord = require('discord.js');

module.exports = async (client, oldEmoji, newEmoji) => {
    const logsChannel = await client.getLogs(newEmoji.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😛・Emoji actualizado`,
        desc: `Se actualizó un emoji`,
        fields: [
            {
                name: `> Emoji`,
                value: `- ${newEmoji}`
            },
            {
                name: `> Antes`,
                value: `- ${oldEmoji.name}`
            },
            {
                name: `> Después`,
                value: `- ${newEmoji.name}`
            },
            {
                name: `> ID`,
                value: `- ${newEmoji.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};