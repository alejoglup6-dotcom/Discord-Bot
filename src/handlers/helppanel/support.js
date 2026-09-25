const Discord = require('discord.js');

module.exports = async (client) => {
    client.on(Discord.Events.InteractionCreate, async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId == "Bot-helppanel") {
            if (interaction.values == "support-Bothelp") {
                interaction.deferUpdate();

                const row2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                            .setCustomId('Bot-helppanel')
                            .setPlaceholder('❌┆Nada seleccionado')
                            .addOptions([
                                {
                                    label: `Comandos`,
                                    description: `¡Muestra los comandos de ${client.user.username}!`,
                                    emoji: "💻",
                                    value: "commands-Bothelp",
                                },
                                {
                                    label: `Invitar`,
                                    description: `Invita a ${client.user.username} a tu servidor`,
                                    emoji: "📨",
                                    value: "invite-Bothelp",
                                },
                                {
                                    label: `Servidor de soporte`,
                                    description: `Únete al servidor de soporte`,
                                    emoji: "❓",
                                    value: "support-Bothelp",
                                },
                                {
                                    label: `Registro de cambios`,
                                    description: `Muestra el registro de cambios de ${client.user.username}`,
                                    emoji: "📃",
                                    value: "changelogs-Bothelp",
                                },
                            ]),
                    );

                let row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Servidor de soporte")
                            .setURL(client.config.discord.serverInvite)
                            .setStyle(Discord.ButtonStyle.Link),
                    );

                client.embed({
                    title: `❓・Soporte`,
                    desc: `¡Mejora tu servidor aún más con ${client.user.username}!`,
                    image: "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
                    url: client.config.discord.serverInvite,
                    components: [row2, row],
                    type: 'edit'
                }, interaction.message)
            }
        }
    });
}

 