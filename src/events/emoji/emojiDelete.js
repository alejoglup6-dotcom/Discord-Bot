const discord = require('discord.js');

module.exports = async (client, emoji) => {
    const logsChannel = await client.getLogs(emoji.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😛・Emoji eliminado`,
        desc: `Se eliminó un emoji`,
        fields: [
            {
                name: `> Nombre`,
                value: `- ${emoji.name}`
            },
            {
                name: `> ID`,
                value: `- ${emoji.id}`
            }
        ]
    }, logsChannel).catch(() => { })
};