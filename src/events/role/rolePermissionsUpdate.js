const Discord = require('discord.js');

module.exports = async (client, role, oldPerms, newPerms) => {

    const logsChannel = await client.getLogs(role.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🧻・Permisos del rol actualizados`,
        desc: `Se actualizó un rol`,
        fields: [
            {
                name: `> Rol`,
                value: `- ${role}`
            },
            {
                name: `> Antes`,
                value: `- ${new Discord.PermissionsBitField(oldPerms).toArray().toLocaleString().split(',').join(', ') || 'Ninguno'}`
            },
            {
                name: `> Después`,
                value: `- ${new Discord.PermissionsBitField(newPerms).toArray().toLocaleString().split(',').join(', ') || 'Ninguno'}`
            },
            {
                name: `> ID`,
                value: `${role.id}`
            },
            {
                name: `> Fecha`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};