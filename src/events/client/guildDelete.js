const discord = require('discord.js');
const schemaFiles = [
    "afk",
    "customCommandAdvanced",
    "birthday",
    "blacklist",
    "channelList",
    "chatbot-channel",
    "count",
    "countChannel",
    "customCommand",
    "economy",
    "economyTimeout",
    "family",
    "functions",
    "guessNumber",
    "guessWord",
    "levelChannels",
    "levelRewards",
    "logChannels",
    "messages",
    "music",
    "notes",
    "privatechannels",
    "reactionRoles",
    "reviewChannels",
    "stats",
    "suggestionChannels",
    "ticketChannels",
    "ticketMessage",
    "tickets",
    "verify",
    "voice",
    "voiceChannels",
    "warnings",
    "wordsnake",
    "messageRewards",
    "fortuna",
    "fortunaAssets",
]
const schemas = schemaFiles.map(file => require(`../../database/models/${file}`));

module.exports = async (client, guild) => {
    const kickLogs = new discord.WebhookClient({
        id: client.webhooks.serverLogs2.id,
        token: client.webhooks.serverLogs2.token,
    });

    if (guild.name == undefined) return;

    const promises = [
        client.shard.broadcastEval(client => client.guilds.cache.size),
        client.shard.broadcastEval(client => client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
    ];
    Promise.all(promises).then(async (results) => {
        const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);

        const embed = new discord.EmbedBuilder()
            .setTitle("🔴・¡Eliminado de un servidor!")
            .addFields(
                { name: "Servidores totales:", value: `${totalGuilds}`, inline: true },
                { name: "Nombre del servidor", value: `${guild.name}`, inline: true },
                { name: "ID del servidor", value: `${guild.id}`, inline: true },
                { name: "Miembros del servidor", value: `${guild.memberCount}`, inline: true },
                { name: "Dueño del servidor", value: `<@!${guild.ownerId}> (${guild.ownerId})`, inline: true },
            )
            .setThumbnail("https://cdn.discordapp.com/attachments/843487478881976381/852419424895631370/BotSadEmote.png")
            .setColor(client.config.colors.normal)
        kickLogs.send({
            username: 'Bot Logs',
            avatarURL: client.user.avatarURL(),
            embeds: [embed],
        });
    })

    for (const schema of schemas) {
        await schema.deleteMany({ Guild: guild.id });
    }
};