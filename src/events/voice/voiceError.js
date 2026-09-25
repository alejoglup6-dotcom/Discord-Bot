const Discord = require('discord.js');

module.exports = (client, error) => {
    if (error.message == undefined) {
        console.log(error);
        error.message = "¡Enviado a la consola!";
    }
    const errorlog = new Discord.WebhookClient({
        id: client.webhooks.voiceErrorLogs.id,
        token: client.webhooks.voiceErrorLogs.token,
    });

    let embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・Error de voz`)
        .addFields(
            { name: "Error", value: `\`\`\`${error.message}\`\`\``},
            { name: `Pila del error`, value: `\`\`\`${error.stack.substr(0, 1018)}\`\`\``},
        )
        .setColor(client.config.colors.normal)
    errorlog.send({
        username: `Bot errors`,
        embeds: [embed],

    }).catch(error => { console.log(error) })
};