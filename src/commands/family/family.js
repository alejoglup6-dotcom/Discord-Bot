const Discord = require("discord.js");

const Schema = require("../../database/models/family");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const target = interaction.options.getUser("user") || interaction.user;

  const data = await Schema.findOne({
    Guild: interaction.guild.id,
    User: target.id,
  });

  client.embed(
    {
      title: `👪・Familia de ${target.username}`,
      thumbnail: target.avatarURL({ size: 1024 }),
      fields: [
        {
          name: `Pareja`,
          value: `${data && data.Partner ? `<@!${data.Partner}>` : `Este usuario no está casado`}`,
        },
        {
          name: `Padres`,
          value: `${data && data.Parent.length > 0 ? `${data.Parent.join(", ")}` : `Este usuario no tiene padres`}`,
        },
        {
          name: `Hijos`,
          value: `${data && data.Children.length > 0 ? `${data.Children.join(", ")}` : `Este usuario no tiene hijos`}`,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
