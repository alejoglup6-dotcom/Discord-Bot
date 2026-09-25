const Discord = require("discord.js");

const Schema = require("../../database/models/afk");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const reason = interaction.options.getString("reason") || `No especificada`;

  Schema.findOne({
    Guild: interaction.guild.id,
    User: interaction.user.id,
  }).then(async (data) => {
    if (data) {
      return client.errNormal(
        {
          error: `¡Ya estás AFK!`,
          type: "editreply",
        },
        interaction,
      );
    } else {
      new Schema({
        Guild: interaction.guild.id,
        User: interaction.user.id,
        Message: reason,
      }).save();

      if (!interaction.member.displayName.includes(`[AFK] `)) {
        interaction.member
          .setNickname(`[AFK] ` + interaction.member.displayName)
          .catch((e) => {});
      }

      client.succNormal(
        {
          text: `Tu AFK se configuró correctamente`,
          type: "ephemeraledit",
        },
        interaction,
      );

      client.embed(
        {
          desc: `¡${interaction.user} ahora está AFK! **Razón:** ${reason}`,
        },
        interaction.channel,
      );
    }
  });
};
