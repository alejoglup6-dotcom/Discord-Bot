const discord = require('discord.js');

/**
 * 
 * @param {import('../../typings.d').Client} client 
 * @param {discord.GuildEmoji} emoji
 * @returns 
 */
module.exports = async (client, emoji) => {
    const logsChannel = await client.getLogs(emoji.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `😛・Emoji creado`,
        desc: `Se creó un emoji`,
        fields: [
            {
                name: `> Emoji`,
                value: `- ${emoji}`
            },
            {
                name: `> Nombre`,
                value: `- ${emoji.name}`
            },
            {
                name: `> ID`,
                value: `- ${emoji.id}`
            },
            {
                name: `> URL`,
                value: `- ${emoji.imageURL({ dynamic: true })}`
            }
        ]
    }, logsChannel).catch(() => { })
};