const Discord = require('discord.js');

module.exports = (client, giveaway, member, reaction) => {
    client.succNormal({
        text: `Se aprobó tu participación en [este sorteo](https://discordapp.com/channels/${giveaway.message.guildId}/${giveaway.message.channelId}/${giveaway.message.id}).`
    }, member).catch(() => { });
};