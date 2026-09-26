const Discord = require('discord.js');
const { bothForms } = require('../../assets/utils/prefixCommands');

module.exports = async (client) => {
    const fields = [
        {
            name: `📺┆Actividades`,
            value: `\`/activities\``,
            inline: true
        },
        {
            name: `🚫┆AFK`,
            value: `\`/afk help\``,
            inline: true
        },
        {
            name: `📣┆Anuncios`,
            value: `\`/announcement help\``,
            inline: true
        },
        {
            name: `👮‍♂️┆Automoderación`,
            value: `\`/automod help\``,
            inline: true
        },
        {
            name: `⚙️┆Configuración automática`,
            value: `\`/autosetup help\``,
            inline: true
        },
        {
            name: `🎂┆Cumpleaños`,
            value: `\`/birthdays help\``,
            inline: true
        },
        {
            name: `🤖┆Bot`,
            value: `\`/bot help\``,
            inline: true
        },
        {
            name: `🎰┆Casino`,
            value: `\`/casino help\``,
            inline: true
        },
        {
            name: `⚙┆Configuración`,
            value: `\`/config help\``,
            inline: true
        },
        {
            name: `💻┆Comandos personalizados`,
            value: `\`/custom-commands help\``,
            inline: true
        },
        {
            name: `💳┆Dcredits`,
            value: `\`/dcredits help\``,
            inline: true
        },
        {
            name: `💰┆Economía`,
            value: `\`/economy help\``,
            inline: true
        },
        {
            name: `👪┆Familia`,
            value: `\`/family help\``,
            inline: true
        },
        {
            name: `😂┆Diversión`,
            value: `\`/fun help\``,
            inline: true
        },
        {
            name: `🎮┆Juegos`,
            value: `\`/games help\``,
            inline: true
        },
        {
            name: `🥳┆Sorteo`,
            value: `\`/giveaway help\``,
            inline: true
        },
        {
            name: `⚙️┆Ajustes del servidor`,
            value: `\`/guild help\``,
            inline: true
        },
        {
            name: `🖼┆Imágenes`,
            value: `\`/images help\``,
            inline: true
        },
        {
            name: `📨┆Invitaciones`,
            value: `\`/invites help\``,
            inline: true
        },
        {
            name: `🆙┆Niveles`,
            value: `\`/levels help\``,
            inline: true
        },
        {
            name: `💬┆Mensajes`,
            value: `\`/messages help\``,
            inline: true
        },
        {
            name: `👔┆Moderación`,
            value: `\`/moderation help\``,
            inline: true
        },
        {
            name: `🎶┆Música`,
            value: `\`/music help\``,
            inline: true
        },
        {
            name: `📓┆Bloc de notas`,
            value: `\`/notepad help\``,
            inline: true
        },
        {
            name: `👤┆Perfil`,
            value: `\`/profile help\``,
            inline: true
        },
        {
            name: `📻┆Radio`,
            value: `\`/radio help\``,
            inline: true
        },
        {
            name: `🕴️┆Fortuna`,
            value: `\`/fortune help\``,
            inline: true
        },
        {
            name: `🎮┆Servidor SA-MP`,
            value: `\`/samp help\``,
            inline: true
        },
        {
            name: `😛┆Roles por reacción`,
            value: `\`/reactionroles help\``,
            inline: true
        },
        {
            name: `🔍┆Búsqueda`,
            value: `\`/search help\``,
            inline: true
        },
        {
            name: `📊┆Estadísticas del servidor`,
            value: `\`/serverstats help\``,
            inline: true
        },
        {
            name: `⚙️┆Configuración`,
            value: `\`/setup help\``,
            inline: true
        },
        {
            name: `🎛┆Soundboard`,
            value: `\`/soundboard help\``,
            inline: true
        },
        {
            name: `🗨️┆Mensajes fijos`,
            value: `\`/stickymessages help\``,
            inline: true
        },
        {
            name: `💡┆Sugerencias`,
            value: `\`/suggestions help\``,
            inline: true
        },
        {
            name: `🤝┆Agradecimientos`,
            value: `\`/thanks help\``,
            inline: true
        },
        {
            name: `🎫┆Tickets`,
            value: `\`/tickets help\``,
            inline: true
        },
        {
            name: `⚒️┆Herramientas`,
            value: `\`/tools help\``,
            inline: true
        },
        {
            name: `🔊┆Voz`,
            value: `\`/voice help\``,
            inline: true
        },
    ];

    // Cada categoría con las dos formas: "/fortuna ayuda · !fortuna ayuda"
    for (const field of fields) {
        const m = field.value.match(/^`\/([\w-]+)(?: (help))?`$/);
        if (m) field.value = bothForms(m[1], m[2], client.config.discord.prefix);
    }

    client.on(Discord.Events.InteractionCreate, async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId == "Bot-helppanel") {
            if (interaction.values == "commands-Bothelp") {
                interaction.deferUpdate();
                let page = 1;

                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('helpPrev')
                            .setEmoji('⬅️')
                            .setStyle(Discord.ButtonStyle.Secondary),

                        new Discord.ButtonBuilder()
                            .setCustomId('helpNext')
                            .setEmoji('➡️')
                            .setStyle(Discord.ButtonStyle.Secondary),

                        new Discord.ButtonBuilder()
                            .setLabel("Invitar")
                            .setURL(client.config.discord.botInvite)
                            .setStyle(Discord.ButtonStyle.Link),

                        new Discord.ButtonBuilder()
                            .setLabel("Servidor de soporte")
                            .setURL(client.config.discord.serverInvite)
                            .setStyle(Discord.ButtonStyle.Link),
                    );

                const row2 = new Discord.ActionRowBuilder()
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
                    title: `❓・Panel de ayuda`,
                    desc: `¡Mira aquí todas las categorías de comandos del bot! \n\n[Invitar](${client.config.discord.botInvite}) | [Votar](https://top.gg/bot/${client.user.id}/vote)`,
                    image: "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
                    fields: fields.slice(0, 24),
                    components: [row2, row],
                    type: 'edit'
                }, interaction.message).then(msg => {
                    const filter = i => i.user.id === interaction.user.id;

                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 100000 });

                    collector.on('collect', async i => {
                        if (i.customId == "helpNext") {
                            if (page == 1) {
                                client.embed({
                                    title: `❓・Panel de ayuda`,
                                    desc: `¡Mira aquí todas las categorías de comandos del bot! \n\n[Invitar](${client.config.discord.botInvite}) | [Votar](https://top.gg/bot/${client.user.id}/vote)`,
                                    fields: fields.slice(24, 48),
                                    components: [row2, row],
                                    type: 'update'
                                }, i)
                                page += 1;
                            }
                        }

                        else if (i.customId == "helpPrev") {
                            if (page == 2) {
                                client.embed({
                                    title: `❓・Panel de ayuda`,
                                    desc: `¡Mira aquí todas las categorías de comandos del bot! \n\n[Invitar](${client.config.discord.botInvite}) | [Votar](https://top.gg/bot/${client.user.id}/vote)`,
                                    fields: fields.slice(0, 24),
                                    components: [row2, row],
                                    type: 'update'
                                }, i)
                                page -= 1;
                            }
                        }
                    });
                })
            }
        }
    });
}

 