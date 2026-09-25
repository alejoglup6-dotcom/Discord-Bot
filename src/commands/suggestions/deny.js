const Discord = require("discord.js");

const Schema = require("../../database/models/suggestionChannels");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  const messageID = interaction.options.getString("id");

  const data = await Schema.findOne({ Guild: interaction.guild.id });
  if (data) {
    const suggestionchannel = interaction.guild.channels.cache.get(
      data.Channel,
    );
    const suggestEmbed = await suggestionchannel.messages.fetch(messageID);
    const embedData = suggestEmbed.embeds[0];

    client.embed(
      {
        title: `${client.emotes.normal.error}・Sugerencia rechazada`,
        desc: `\`\`\`${embedData.description}\`\`\``,
        color: client.config.colors.error,
        author: {
          name: embedData.author.name,
          iconURL: embedData.author.iconURL,
        },
        type: "edit",
      },
      suggestEmbed,
    );

    try {
      const user = await client.users.cache.find(
        (u) => u.tag === embedData.author.name,
      );

      if (user) {
        client
          .embed(
            {
              title: `${client.emotes.normal.check}・Sugerencia rechazada`,
              desc: `¡Un moderador rechazó tu sugerencia en ${interaction.guild.name}!`,
              fields: [
                {
                  name: `💬┆Sugerencia`,
                  value: `${embedData.description}`,
                },
              ],
            },
            user,
          )
          .catch({});
      }
    } catch {}

    client.succNormal(
      {
        text: "Sugerencia rechazada correctamente",
        fields: [
          {
            name: `💬┆Sugerencia`,
            value: `${embedData.description}`,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  } else {
    client.errNormal(
      {
        error: `¡No hay canal de sugerencias configurado! Haz la configuración primero`,
        type: "editreply",
      },
      interaction,
    );
  }
};
