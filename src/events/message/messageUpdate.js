const Discord = require('discord.js');

module.exports = async (client, oldMessage, newMessage) => {
    try {
        if (!oldMessage.content || !newMessage.content) return;
        if (oldMessage.content === newMessage.content) return;
        if (oldMessage.author.bot) return;

        const logsChannel = await client.getLogs(oldMessage.guild.id);
        if (!logsChannel) return;

let row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji("🔗")
                        .setLabel("Ir al mensaje")
                        .setURL(`https://discordapp.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id}`)
                        .setStyle(Discord.ButtonStyle.Link),
                  );
      
        client.embed({
            title: `💬・Mensaje editado`,
            desc: `Se editó un mensaje`,
            fields: [
                {
                    name: `> Autor`,
                    value: `- ${newMessage.member.user} (${newMessage.member.user.tag})`
                },
                {
                    name: `> Fecha`,
                    value: `- ${newMessage.createdAt}`
                },
                {
                    name: `> Canal`,
                    value: `- ${newMessage.channel} (${newMessage.channel.name})`
                },
                {
                    name: `> Mensaje anterior`,
                    value: `\`\`\`${oldMessage.content.replace(/`/g, "'")}\`\`\``
                },
                {
                    name: `> Mensaje nuevo`,
                    value: `\`\`\`${newMessage.content.replace(/`/g, "'")}\`\`\``
                },
                {
                    name: `> Fecha`,
                    value: `- <t:${Math.floor(newMessage.createdTimestamp / 1000)}:R>`
                }
            ],
            components: [row]
        }, logsChannel).catch(() => { })
    }
    catch { }
};
