const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const channel = interaction.options.getChannel("channel");

  client.embed(
    {
      title: `ℹ・Información del canal`,
      desc: `Información del canal: <#${channel.id}>`,
      fields: [
        {
          name: "Tipo",
          value: `${channel.type}`,
          inline: true,
        },
        {
          name: "ID",
          value: `${channel.id}`,
          inline: true,
        },
        {
          name: "Tipo",
          value: `${channel.type}`,
          inline: true,
        },
        {
          name: "Creado el",
          value: `${channel.createdAt}`,
          inline: true,
        },
        {
          name: "Tema",
          value: `${channel.topic ? channel.topic : "N/A"}`,
          inline: true,
        },
        {
          name: "NSFW",
          value: `${channel.nsfw}`,
          inline: true,
        },
        {
          name: "Categoría",
          value: `${channel.parentID ? channel.parentID : "N/A"}`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
