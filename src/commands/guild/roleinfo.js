const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const role = interaction.options.getRole("role");
  const perms = role.permissions.toArray();

  client.embed(
    {
      title: `ℹ️・Información del rol`,
      thumbnail: interaction.guild.iconURL({ dynamic: true, size: 1024 }),
      desc: `Información sobre el rol ${role}`,
      fields: [
        {
          name: "ID del rol:",
          value: `${role.id}`,
          inline: true,
        },
        {
          name: "Nombre del rol:",
          value: `${role.name}`,
          inline: true,
        },
        {
          name: "Mencionable:",
          value: `${role.mentionable ? "Sí" : "No"}`,
          inline: true,
        },
        {
          name: "Permisos del rol:",
          value: `${perms.join(", ")}`,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
