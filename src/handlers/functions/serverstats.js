const Schema = require("../../database/models/stats");
const Discord = require('discord.js');

module.exports = async (client) => {
    client.getTemplate = async (guild) => {
        try {
            const data = await Schema.findOne({ Guild: guild.id });

            if (data && data.ChannelTemplate) {
                return data.ChannelTemplate;
            }
            else {
                return `{emoji} {name}`
            }
        }
        catch {
            return `{emoji} {name}`
        }
    }

    // Los contadores se actualizan en statsRefresh.js (al arrancar, cada 10 minutos y tras cada cambio)

    client.on(Discord.Events.ClientReady, async client => client.emit('updateClock'))
}

 