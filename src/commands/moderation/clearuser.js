const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  const member = interaction.options.getUser("user");

  // Se revisan los últimos 100 mensajes de cada canal de texto; Discord no
  // permite borrar en bloque mensajes de más de 14 días
  let deleted = 0;
  for (const channel of interaction.guild.channels.cache.values()) {
    if (!channel.isTextBased() || !channel.messages) continue;

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter((m) => m.author.id === member.id);
      if (!userMessages.size) continue;

      const result = await channel.bulkDelete(userMessages, true);
      deleted += result.size;
    } catch {
      // Sin permisos en este canal
    }
  }

  client.succNormal(
    {
      text: `Eliminé los mensajes correctamente`,
      fields: [
        {
          name: "👤┆Usuario",
          value: `${member} (${member.tag})`,
          inline: true,
        },
        {
          name: "💬┆Cantidad",
          value: `${deleted}`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
