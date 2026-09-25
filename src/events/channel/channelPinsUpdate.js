const discord = require('discord.js');

module.exports = async (client, channel, time) => {
    let types = {
        0: "Canal de texto",
        2: "Canal de voz",
        4: "Categoría",
        5: "Canal de anuncios",
        10: "Hilo de anuncios",
        11: "Hilo público",
        12: "Hilo privado",
        13: "Canal de escenario",
        14: "Categoría",
    }

    const logsChannel = await client.getLogs(channel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🔧・Mensajes fijados actualizados`,
        desc: `Se actualizaron los mensajes fijados del canal`,
        fields: [
            {
                name: `> Nombre`,
                value: `- ${channel.name}`
            },
            {
                name: `> ID`,
                value: `- ${channel.id}`
            },
            {
                name: `> Categoría`,
                value: `- ${channel.parent}`
            },
            {
                name: `> Canal`,
                value: `- <#${channel.id}>`
            },
            {
                name: `> Tipo`,
                value: `- ${types[channel.type]}`
            },
            {
                name: `> Fijado el`,
                value: `- <t:${(time / 1000).toFixed(0)}>`
            }
        ]
    }, logsChannel).catch(() => { })
};