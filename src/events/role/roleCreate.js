const discord = require('discord.js');

module.exports = async (client, role) => {
    const logsChannel = await client.getLogs(role.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🧻・Rol creado`,
        desc: `Se creó un rol`,
        fields: [
            {
                name: `> Rol`,
                value: `- ${role}`
            },
            {
                name: `> Nombre`,
                value: `- ${role.name}`
            },
            {
                name: `> ID`,
                value: `- ${role.id}`
            },
            {
                name: `> Color`,
                value: `${role.hexColor}`
            },
            {
                name: `> Posición`,
                value: `${role.position}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })

};