const Discord = require('discord.js');
const generator = require('generate-password');

module.exports = (client, err, command, interaction) => {
    console.log(err);
    const password = generator.generate({
        length: 10,
        numbers: true
    });

    const errorlog = new Discord.WebhookClient({
        id: client.webhooks.errorLogs.id,
        token: client.webhooks.errorLogs.token,
    });

    let embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・${password}`)
        .addFields(
            { name: "✅┇Servidor", value: `${interaction.guild.name} (${interaction.guild.id})`},
            { name: `💻┇Comando`, value: `${command}`},
            { name: `💬┇Error`, value: `\`\`\`${err}\`\`\``},
            { name: `📃┇Pila del error`, value: `\`\`\`${err.stack.substr(0, 1018)}\`\`\``},
        )
        .setColor(client.config.colors.normal)
    errorlog.send({
        username: `Bot errors`,
        embeds: [embed],

    }).catch(error => { console.log(error) })

    let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setLabel("Servidor de soporte")
                .setURL(client.config.discord.serverInvite)
                .setStyle(Discord.ButtonStyle.Link),
        );

    client.embed({
        title: `${client.emotes.normal.error}・Error`,
        desc: `Hubo un error al ejecutar este comando`,
        color: client.config.colors.error,
        fields: [
            {
                name: `Código de error`,
                value: `\`${password}\``,
                inline: true,
            },
            {
                name: `¿Y ahora qué?`,
                value: `Puedes contactar a los desarrolladores uniéndote al servidor de soporte`,
                inline: true,
            }
        ],
        components: [row],
        type: 'editreply'
    }, interaction).catch(() => {
        client.embed({
            title: `${client.emotes.normal.error}・Error`,
            desc: `Hubo un error al ejecutar este comando`,
            color: client.config.colors.error,
            fields: [
                {
                    name: `Código de error`,
                    value: `\`${password}\``,
                    inline: true,
                },
                {
                    name: `¿Y ahora qué?`,
                    value: `Puedes contactar a los desarrolladores uniéndote al servidor de soporte`,
                    inline: true,
                }
            ],
            components: [row],
            type: 'editreply'
        }, interaction)
    })
};