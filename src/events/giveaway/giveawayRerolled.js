const Discord = require('discord.js');

module.exports = (client, giveaway, winners) => {
    winners.forEach((member) => {
        client.embed({
            title: `🎉・Sorteo terminado`,
            desc: `¡Felicidades ${member.user.username}! ¡Ganaste el sorteo!`,
            fields: [
                {
                    name: `🎁┆Premio`,
                    value: `${giveaway.prize}`,
                    inline: true
                },
                {
                    name: `🥳┆Sorteo`,
                    value: `[Haz clic aquí](https://discordapp.com/channels/${giveaway.message.guildId}/${giveaway.message.channelId}/${giveaway.message.id})`,
                    inline: true
                }
            ]
        
        }, member).catch(() => { });
    });
};