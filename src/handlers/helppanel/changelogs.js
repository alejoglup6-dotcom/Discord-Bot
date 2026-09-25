const Discord = require('discord.js');

module.exports = async (client) => {
    client.on(Discord.Events.InteractionCreate, async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId == "Bot-helppanel") {
            if (interaction.values == "changelogs-Bothelp") {
                interaction.deferUpdate();

                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                            .setCustomId('Bot-helppanel')
                            .setPlaceholder('❌┆Nada seleccionado')
                            .addOptions([
                                {
                                    label: `Comandos`,
                                    description: `¡Muestra los comandos de Bot!`,
                                    emoji: "💻",
                                    value: "commands-Bothelp",
                                },
                                {
                                    label: `Invitar`,
                                    description: `Invita al bot a tu servidor`,
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
                                    description: `Muestra el registro de cambios del bot`,
                                    emoji: "📃",
                                    value: "changelogs-Bothelp",
                                },
                            ]),
                    );

                client.embed({
                    title: "📃・Registro de cambios",
                    desc: `_____`,
                    thumbnail: client.user.avatarURL({ size: 1024 }),
                    fields: [
            	        {
                            name: "📢┆¡Atención!",
                            value: 'Este es el registro de cambios del bot. Aquí puedes ver los cambios que se le han hecho.',
                            inline: false,
                        },
                        {
                            name: "📃┆Registro de cambios",
                            value: '10/12/2022 - Se actualizó el bot a la última versión de discord.js (v14)',
                            inline: false,
                        }
                    ],
                    components: [row],
                    type: 'edit'
                }, interaction.message)
            }
        }
    });
}

 