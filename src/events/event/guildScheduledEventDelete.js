const discord = require('discord.js');

module.exports = async (client, event) => {
    let types = {
        GUILD_ONLY: "Solo el servidor",
        PUBLIC: "Público",
    }

    let locations = {
        NONE: "Ninguno",
        STAGE_INSTANCE: "Canal de escenario",
        VOICE: "Canal de voz",
        EXTERNAL: `Externo`
    }

    const logsChannel = await client.getLogs(event.guildId);
    if (!logsChannel) return;

    client.embed({
        title: `🎡・Evento eliminado`,
        desc: `Se eliminó un evento`,
        fields: [
            {
                name: `> Nombre`,
                value: `- ${event.name}`
            },
            {
                name: `> Descripción`,
                value: `- ${event.description || 'Ninguna'}`
            },
            {
                name: `> Inicio`,
                value: `- <t:${(event.scheduledStartTimestamp / 1000).toFixed(0)}>`
            },
            {
                name: `> Privacidad`,
                value: `- ${types[event.privacyLevel]}`
            },
            {
                name: `> Creador`,
                value: `- <@!${event.creatorId}> (${event.creatorId})`
            },
            {
                name: `> Tipo de ubicación`,
                value: `- ${locations[event.entityType]}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};