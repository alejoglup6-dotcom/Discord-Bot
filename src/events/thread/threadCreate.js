const discord = require('discord.js');

module.exports = async (client, channel) => {
    let types = {
        10: "Hilo de anuncios",
        11: "Hilo público",
        12: "Hilo privado",
    }

    const logsChannel = await client.getLogs(channel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📖・Hilo creado`,
        desc: `Se creó un hilo`,
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
                value: `${channel.parent}`
            },
            {
                name: `> Canal`,
                value: `<#${channel.id}>`
            },
            {
                name: `> Tipo`,
                value: `${types[channel.type]}`
            }
        ]
    }, logsChannel).catch(() => { })
};