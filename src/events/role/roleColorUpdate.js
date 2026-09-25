const discord = require('discord.js');

module.exports = async (client, role, oldColor, newColor) => {
    const logsChannel = await client.getLogs(role.guild.id);
    if (!logsChannel) return;

    client.embed({
        title: `🧻・Color del rol actualizado`,
        desc: `Se actualizó un rol`,
        fields: [
            {
                name: `> Rol`,
                value: `- ${role}`
            },
            {
                name: `> Antes`,
                value: `- #${oldColor.toString(16)}`
            },
            {
                name: `> Después`,
                value: `- #${newColor.toString(16)}`
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