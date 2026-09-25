const discord = require('discord.js');

module.exports = async (client, role, oldName, newName) => {
    const logsChannel = await client.getLogs(role.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🧻・Nombre del rol actualizado`,
        desc: `Se actualizó un rol`,
        fields: [
            {
                name: `> Rol`,
                value: `- ${role}`
            },
            {
                name: `> Antes`,
                value: `- ${oldName}`
            },
            {
                name: `> Después`,
                value: `- ${newName}`
            },
            {
                name: `> ID`,
                value: `${role.id}`
            },
            {
                name: `> Fecha`,
                value: `- <t:${Math.floor(Date.now() / 1000)}:R>`
            }
        ]
    }, logsChannel).catch(() => { })
};