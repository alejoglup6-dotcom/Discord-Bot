const Discord = require('discord.js');

const store = require("../../database/models/economyStore");

module.exports = async (client, interaction, args, message) => {
    store.find({ Guild: interaction.guild.id }).then(async (storeData ) => {
        if (storeData && storeData.length > 0) {
            const lb = storeData.map(e => `**<@&${e.Role}>** - ${client.emotes.economy.coins} $${e.Amount} \n**Para comprar:** \`buy ${e.Role}\``);

            await client.createLeaderboard(`🛒・Tienda de ${interaction.guild.name}`, lb, interaction);
            client.embed({ 
                title: `🛒・Tienda del bot`, 
                desc: `**Caña de pescar** - ${client.emotes.economy.coins} $100 \n**Para comprar:** \`buy fishingrod\``, 
            }, interaction.channel);
        }
        else {
            client.errNormal({ 
                error: `¡No hay tienda en este servidor!`, 
                type: 'editreply' 
            }, interaction);
        }
    })

}

 