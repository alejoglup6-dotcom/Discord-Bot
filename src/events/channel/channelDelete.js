const discord = require('discord.js');

const ticketChannels = require("../../database/models/ticketChannels");

module.exports = async (client, channel) => {
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
        title: `🔧・Canal eliminado`,
        desc: `Se eliminó un canal`,
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
                name: `> Tipo`,
                value: `- ${types[channel.type]}`
            }
        ]
    }, logsChannel).catch(() => { })

    try {
        ticketChannels.findOne({ Guild: channel.guild.id, channelID: channel.id }).then(async (data ) => {
            if (data) {
                var remove = await ticketChannels.deleteOne({ Guild: channel.guild.id, channelID: channel.id });
            }
        })
    }
    catch { }
};