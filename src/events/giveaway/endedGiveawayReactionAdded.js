const Discord = require('discord.js');

module.exports = (client, giveaway, member, reaction) => {
    client.errNormal({
        error: `¡Por desgracia, el sorteo ya terminó! Ya no puedes participar`
    }, member).catch(() => { });
};