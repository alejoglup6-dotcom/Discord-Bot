const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkBotPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageChannels],
      perms: [Discord.PermissionsBitField.Flags.ManageChannels],
    },
    interaction,
  );

  if (perms == false) return;

  let limit = interaction.options.getNumber("limit");

  const channel = interaction.member.voice.channel;
  if (!channel)
    return client.errNormal(
      {
        error: `¡No estás en un canal de voz!`,
        type: "editreply",
      },
      interaction,
    );
  var checkVoice = await client.checkVoice(interaction.guild, channel);
  if (!checkVoice) {
    return client.errNormal(
      {
        error: `¡No puedes editar este canal!`,
        type: "editreply",
      },
      interaction,
    );
  } else {
    channel.setUserLimit(limit);

    client.succNormal(
      {
        text: `¡El límite del canal se ajustó a \`${limit}\`!`,
        fields: [
          {
            name: `📘┆Canal`,
            value: `${channel} (${channel.name})`,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  }
};
