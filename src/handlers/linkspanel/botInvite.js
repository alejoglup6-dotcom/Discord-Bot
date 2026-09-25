const Discord = require('discord.js');

module.exports = async (client) => {
    client.on(Discord.Events.InteractionCreate, async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId == "Bot-linkspanel") {
            if (interaction.values == "invite-linkspanel") {
                interaction.deferUpdate();

                const row2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                            .setCustomId('Bot-linkspanel')
                            .setPlaceholder('❌┆Nada seleccionado')
                            .addOptions([
                                {
                                    label: `Servidor de soporte`,
                                    description: `Únete al servidor de soporte`,
                                    emoji: "❓",
                                    value: "support-linkspanel",
                                },
                                {
                                    label: `Invitar al bot`,
                                    description: `Invita al bot a tu servidor`,
                                    emoji: "📨",
                                    value: "invite-linkspanel",
                                },
                                {
                                    label: `Servidor de la comunidad`,
                                    description: `¡Únete al servidor de la comunidad!`,
                                    emoji: "🌍",
                                    value: "community-linkspanel",
                                },
                                {
                                    label: `Top.gg`,
                                    description: `Muestra el enlace de top.gg`,
                                    emoji: "📃",
                                    value: "top.gg-linkspanel",
                                },
                            ]),
                    );

                let row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Invitar al bot")
                            .setURL(client.config.discord.botInvite)
                            .setStyle(Discord.ButtonStyle.Link),
                    );

                client.embed({
                    title: `📨・Invitar al bot`,
                    desc: `¡Mejora tu servidor aún más con Bot!`,
                    image: "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
                    url: client.config.discord.serverInvite,
                    components: [row2, row],
                    type: 'edit'
                }, interaction.message)
            }
        }
    })
}

 