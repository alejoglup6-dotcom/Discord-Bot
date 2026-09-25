const discord = require('discord.js');

module.exports = async (client, oldChannel, newChannel) => {
    let types = {
        10: "Hilo de anuncios",
        11: "Hilo público",
        12: "Hilo privado",
    }

    const logsChannel = await client.getLogs(newChannel.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `📖・Hilo actualizado`,
        desc: `Se actualizó un hilo`,
        fields: [
            {
                name: `> Nombre anterior`,
                value: `- ${oldChannel.name}`
            },
            {
                name: `> Nombre nuevo`,
                value: `- ${newChannel.name}`
            },
            {
                name: `> ID`,
                value: `- ${newChannel.id}`
            },
            {
                name: `> Categoría`,
                value: `${newChannel.parent}`
            },
            {
                name: `> Canal`,
                value: `<#${newChannel.id}>`
            },
            {
                name: `> Tipo`,
                value: `${types[newChannel.type]}`
            }
        ]
    }, logsChannel).catch(() => { })
};