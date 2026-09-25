const Discord = require('discord.js');

const Functions = require("../../database/models/functions");

module.exports = async (client, guild) => {
    const webhookClient = new Discord.WebhookClient({
        id: client.webhooks.serverLogs.id,
        token: client.webhooks.serverLogs.token,
    });

    if (guild == undefined) return;

    new Functions({
        Guild: guild.id,
        Prefix: client.config.discord.prefix
    }).save();

    try {
        const promises = [
            client.shard.broadcastEval(client => client.guilds.cache.size),
            client.shard.broadcastEval(client => client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
        ];
        Promise.all(promises)
            .then(async (results) => {
                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
                const embed = new Discord.EmbedBuilder()
                    .setTitle("🟢・¡Añadido a un nuevo servidor!")
                    .addFields(
                        { name: "Servidores totales:", value: `${totalGuilds}`, inline: true },
                        { name: "Nombre del servidor", value: `${guild.name}`, inline: true },
                        { name: "ID del servidor", value: `${guild.id}`, inline: true },
                        { name: "Miembros del servidor", value: `${guild.memberCount}`, inline: true },
                        { name: "Dueño del servidor", value: `<@!${guild.ownerId}> (${guild.ownerId})`, inline: true },
                    )
                    .setThumbnail("https://cdn.discordapp.com/attachments/843487478881976381/852419422392156210/BotPartyEmote.png")
                    .setColor(client.config.colors.normal)
                webhookClient.send({
                    username: 'Bot Logs',
                    avatarURL: client.user.avatarURL(),
                    embeds: [embed],
                });
            })

        let defaultChannel = "";
        guild.channels.cache.forEach((channel) => {
            if (channel.type == Discord.ChannelType.GuildText && defaultChannel == "") {
                if (channel.permissionsFor(guild.members.me).has(Discord.PermissionFlagsBits.SendMessages)) {
                    defaultChannel = channel;
                }
            }
        })

        let row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Invitar")
                    .setURL(client.config.discord.botInvite)
                    .setStyle(Discord.ButtonStyle.Link),

                new Discord.ButtonBuilder()
                    .setLabel("Servidor de soporte")
                    .setURL(client.config.discord.serverInvite)
                    .setStyle(Discord.ButtonStyle.Link),
            );

        client.embed({
            title: "¡Gracias por invitar al bot!",
            image: "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/bot_banner_invite.jpg",
            fields: [{
                name: "❓┆¿Cómo lo configuro?",
                value: 'El prefijo por defecto es \`/\` \nPara hacer las configuraciones de Bot usa \`/setup\`',
                inline: false,
            },
            {
                name: "☎️┆Necesito ayuda, ¿qué hago?",
                value: `Puedes pedir ayuda al equipo de Drok en el [[servidor de soporte]](${client.config.discord.serverInvite})`,
                inline: false,
            },
            {
                name: "💻┆¿Cuáles son los comandos?",
                value: 'Mira la lista de comandos con \`/help\`',
                inline: false,
            },
            {
                name: "📨┆¡Invita al bot!",
                value: `Invita al bot haciendo clic [[AQUÍ]](${client.config.discord.botInvite})`,
                inline: false,
            },
            ],
            components: [row], 
        }, defaultChannel)
    }
    catch (err) {
        console.log(err);
    }


};