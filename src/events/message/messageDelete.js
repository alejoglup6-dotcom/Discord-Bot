const discord = require('discord.js');

module.exports = async (client, messageDeleted) => {
    try {
        if (!messageDeleted) return;
        if (messageDeleted.author.bot) return;

        var content = messageDeleted.content;
        if (!content) content = "No hay texto";

        if (messageDeleted.attachments.size > 0) content = messageDeleted.attachments.first()?.url;

        const logsChannel = await client.getLogs(messageDeleted.guild.id);
        if (!logsChannel) return;

        client.embed({
            title: `💬・Mensaje eliminado`,
            desc: `Se eliminó un mensaje`,
            fields: [
                {
                    name: `> Autor`,
                    value: `- ${messageDeleted.author} (${messageDeleted.author.tag})`
                },
                {
                    name: `> Fecha`,
                    value: `- ${messageDeleted.createdAt}`
                },
                {
                    name: `> Canal`,
                    value: `- ${messageDeleted.channel} (${messageDeleted.channel.name})`
                },
                {
                    name: `> Mensaje`,
                    value: `\`\`\`${content.replace(/`/g, "'")}\`\`\``
                },
                {
                    name: `> Fecha`,
                    value: `- <t:${Math.floor(messageDeleted.createdTimestamp / 1000)}:R>`
                }
            ]
        }, logsChannel).catch(() => { })
    }
    catch { }
};