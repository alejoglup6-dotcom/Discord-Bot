const Discord = require("discord.js");

/**
 * @param {Discord.Client} client
 * @param {Discord.GuildMember} oldMember
 * @param {Discord.GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
    if (!oldMember || !newMember) return;

    let removedRoles;
    let addedRoles;

    if (oldMember.partial) {
        try {
            const audit = await newMember.guild.fetchAuditLogs({
                type: Discord.AuditLogEvent.MemberRoleUpdate,
                limit: 10,
            });
            
            const entry = audit.entries.find(
                (e) =>
                    e.target.id === newMember.id &&
                    e.createdTimestamp > Date.now() - 5000,
            );

            if (!entry) return;

            removedRoles = entry.changes[0].old
                ? new Discord.Collection(
                      entry.changes[0].old.map((role) => [role.id, role]),
                  )
                : new Discord.Collection();
            
            addedRoles = entry.changes[0].new
                ? new Discord.Collection(
                      entry.changes[0].new.map((role) => [role.id, role]),
                  )
                : new Discord.Collection();
            

        } catch (err) {
            return;
        }
    } else {
        // Find actual role changes
        removedRoles = oldMember.roles.cache.filter(
            (role) => !newMember.roles.cache.has(role.id),
        );
        addedRoles = newMember.roles.cache.filter(
            (role) => !oldMember.roles.cache.has(role.id),
        );
    }


    // Nothing actually changed
    if (removedRoles.size === 0 && addedRoles.size === 0) return;

    const logsChannel = await client.getLogs(newMember.guild.id);
    if (!logsChannel) return;

    const oldRoles = removedRoles.size
        ? removedRoles.map((role) => `<@&${role.id}>`).join(" ")
        : "No se quitaron roles";

    const newRoles = addedRoles.size
        ? addedRoles.map((role) => `<@&${role.id}>`).join(" ")
        : "No se añadieron roles";

    await client.embed(
        {
            title: `Roles de ${newMember.user.username} cambiados`,
            desc: `Se cambiaron los roles de <@${newMember.id}>`,
            fields: [
                {
                    name: "> Roles quitados",
                    value: oldRoles,
                },
                {
                    name: "> Roles añadidos",
                    value: newRoles,
                },
            ],
        },
        logsChannel,
    );
};
