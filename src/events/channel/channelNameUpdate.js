const discord = require('discord.js');

module.exports = async (client, channel, oldName, newName) => {
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
        title: `🔧・Nombre de canal cambiado`,
        desc: `Se modificó el nombre de un canal`,
        fields: [
            {
                name: `> Nombre anterior`,
                value: `- ${oldName}`
            },
            {
                name: `> Nombre nuevo`,
                value: `- ${newName}`
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
            }
        ]
    }, logsChannel).catch(() => { })
};