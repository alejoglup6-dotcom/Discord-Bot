const discord = require('discord.js');

module.exports = async (client, oldEvent, newEvent) => {
    const logsChannel = await client.getLogs(newEvent.guildId);
    if (!logsChannel) return;

    client.embed({
        title: `🎡・Evento actualizado`,
        desc: `Se actualizó un evento`,
        fields: [
            {
                name: `> Nombre anterior`,
                value: `- ${oldEvent.name}`
            },
            {
                name: `> Nombre nuevo`,
                value: `- ${newEvent.name}`
            },
            {
                name: `> Descripción anterior`,
                value: `- ${oldEvent.description || 'Ninguna'}`
            },
            {
                name: `> Descripción nueva`,
                value: `- ${newEvent.description || 'Ninguna'}`
            },
            {
                name: `> Hora anterior`,
                value: `- <t:${(oldEvent.scheduledStartTimestamp / 1000).toFixed(0)}>`
            },
            {
                name: `> Hora nueva`,
                value: `- <t:${(newEvent.scheduledStartTimestamp / 1000).toFixed(0)}>`
            },
            {
                name: `> Creador`,
                value: `- <@!${newEvent.creatorId}> (${newEvent.creatorId})`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};