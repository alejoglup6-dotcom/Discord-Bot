const { CommandInteraction, Client } = require('discord.js');
const { ContextMenuCommandBuilder } = require('discord.js');
const Discord = require('discord.js');
const axios = require("axios");

const model = require('../../database/models/badge');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Userinfo')
        .setType(2),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: false });
        const member = await interaction.guild.members.fetch(interaction.options.getUser('user').id);
        if (!member) return client.errNormal({
            error: "¡Este usuario no está en este servidor!",
            type: 'editreply'
        }, interaction);
        const badgeFlags = {
            DEVELOPER: client.emotes.badges.developer,
            BUGS: client.emotes.badges.bug,
            MANAGEMENT: client.emotes.badges.management,
            PREMIUM: client.emotes.badges.premium,
            SUPPORTER: client.emotes.badges.supporter,
            TEAM: client.emotes.badges.team,
            BOOSTER: client.emotes.badges.booster,
            PARTNER: client.emotes.badges.partner,
            VOTER: client.emotes.badges.voter,
            SUPPORT: client.emotes.badges.support,
            MODERATOR: client.emotes.badges.moderator,
            DESIGNER: client.emotes.badges.designer,
            MARKETING: client.emotes.badges.marketing
        }

        const flags = {
            ActiveDeveloper: "👨‍💻・Desarrollador activo",
            BugHunterLevel1: "🐛・Cazador de bugs de Discord",
            BugHunterLevel2: "🐛・Cazador de bugs de Discord",
            CertifiedModerator: "👮‍♂️・Moderador certificado",
            HypeSquadOnlineHouse1: "🏠・Miembro de House Bravery",
            HypeSquadOnlineHouse2: "🏠・Miembro de House Brilliance",
            HypeSquadOnlineHouse3: "🏠・Miembro de House Balance",
            HypeSquadEvents: "🏠・Eventos de HypeSquad",
            PremiumEarlySupporter: "👑・Early Supporter",
            Partner: "👑・Partner",
            Quarantined: "🔒・Quarantined", // Not sure if this is still a thing
            Spammer: "🔒・Spammer", // Not sure if this one works
            Staff: "👨‍💼・Staff de Discord",
            TeamPseudoUser: "👨‍💼・Equipo de Discord",
            VerifiedBot: "🤖・Bot verificado",
            VerifiedDeveloper: "👨‍💻・Desarrollador de bots verificado (pionero)",
        }

        let Badges = await model.findOne({ User: member.user.id });
        if (!Badges) Badges = { User: member.user.id }
        const roles = member.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, -1);
        const userFlags = member.user.flags ? member.user.flags.toArray() : [];

        return client.embed({
            title: `👤・Información del usuario`,
            desc: `Información sobre ${member.user.username}`,
            thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
            image: member.user.bannerURL({ dynamic: true, size: 1024 }),
            fields: [
                {
                    name: "Nombre de usuario",
                    value: `${member.user.username}`,
                    inline: true,
                },
                {
                    name: "Discriminador",
                    value: `${member.user.discriminator}`,
                    inline: true,
                },
                {
                    name: "Apodo",
                    value: `${member.nickname || 'Sin apodo'}`,
                    inline: true,
                },
                {
                    name: "ID",
                    value: `${member.user.id}`,
                    inline: true,
                },
                {
                    name: "Flags",
                    value: `${userFlags.length ? userFlags.map(flag => flags[flag]).join(', ') : 'Ninguna'}`,
                    inline: true,
                },
                {
                    name: "Insignias",
                    value: `${Badges.FLAGS ? Badges.FLAGS.map(flag => badgeFlags[flag]).join(' ') : 'Ninguna'}`,
                    inline: true,
                },
                {
                    name: "Se unió a Discord el",
                    value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>`,
                    inline: true,
                },
                {
                    name: "Se unió al servidor el",
                    value: `<t:${Math.round(member.joinedAt / 1000)}>`,
                    inline: true,
                },
                {
                    name: `Roles [${roles.length}]`,
                    value: `${roles.length ? roles.join(', ') : 'Ninguno'}`,
                    inline: false,
                }
            ],
            type: 'editreply'
        }, interaction)
    },
};

 