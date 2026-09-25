const Discord = require('discord.js');

module.exports = async (client, guild, bannerURL) => {
    const logsChannel = await client.getLogs(guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🖼️・Nuevo banner`,
        desc: `Se actualizó el banner del servidor`,
        image: bannerURL
    }, logsChannel).catch(() => { })
};